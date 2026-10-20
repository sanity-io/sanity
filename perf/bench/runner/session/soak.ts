import process from 'node:process'

import {type Browser, type Page} from 'playwright'

import {
  type BenchScenario,
  type InteractionTarget,
  scenarioFixture,
  type SoakPlan,
} from '../../scenarios/types'
import {median} from '../../stats/quantiles'
import {createSessionContext} from '../browser'
import {type RunningSide} from '../servers'
import {soakExcursionSchedule, soakSettleMinuteFor, soakTypingTarget} from '../soakPlan'
import {SessionError} from './errors'
import {
  DEFAULT_SESSION_CONFIG,
  drainEntries,
  focusField,
  HERMETICITY_HINT,
  readCpuMetrics,
  readMemorySnapshot,
  type ReadOnlyInterruptions,
  type SessionConfig,
  toLatencies,
  typeKeystrokes,
  waitUntilEditable,
} from './interaction'
import {awaitReadiness, gotoScenario} from './navigation'
import {runStep} from './steps'

export interface SoakSample {
  minute: number
  heapMb: number
  domNodes: number
  listeners: number
  /** Median keystroke latency over the past interval (null before typing). */
  latencyP50Ms: number | null
  /** Main-thread task time spent during the past interval (null at minute 0). */
  cpuTaskMs: number | null
  /** Open listener connections on the mock — socket leaks across reconnects. */
  connections: number
  /** Requests the mock served during the past interval (minute 0 = boot). */
  requests: number
}

export interface SoakSessionResult {
  minutes: number
  /** First steady-state minute: growth is read from here on (see `@repo/utils/soak-settle`). */
  settleMinute: number
  samples: SoakSample[]
  interruptions: ReadOnlyInterruptions
}

const BURST_KEYSTROKES = 40
const STEP_TIMEOUT_MS = 30_000

/**
 * Remove the burst just typed. A string field is select-all-deleted. Portable
 * Text gets one Backspace per character instead: select-all there would wipe
 * the whole seeded body, and the big document is the point of the soak.
 */
async function eraseBurst(
  page: Page,
  target: InteractionTarget,
  cadenceMs: number,
  interruptions: ReadOnlyInterruptions,
): Promise<void> {
  if (target.kind === 'pte') {
    for (let index = 0; index < BURST_KEYSTROKES; index++) {
      await waitUntilEditable(page, interruptions)
      await page.keyboard.press('Backspace')
      await page.waitForTimeout(cadenceMs)
    }
    return
  }
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+a' : 'Control+a')
  await page.keyboard.press('Backspace')
}

/**
 * Soak check: one long session typing continuously (bounded content —
 * each cycle types a burst then erases it), sampling every minute.
 * The workload is constant and self-erasing, so every series should be
 * flat: a rising heap/listener/DOM slope is a retention regression (a
 * leak), a rising latency/CPU slope is degradation under sustained use,
 * and a rising connection or request rate is a resubscribe loop. Runs in
 * the daily cron, not on PRs.
 *
 * A scenario with a soak plan (`BenchScenario.soak`) also runs one excursion
 * before every burst — menus, popovers, tooltips, a switch to another
 * document and back — in a seeded order, and can serve live presence with a
 * mock peer. Without a plan the session is the original typing-only soak.
 */
export async function runSoakSession(options: {
  browser: Browser
  running: RunningSide
  scenario: BenchScenario
  instrumentation: string
  minutes: number
  config?: Partial<SessionConfig>
  log?: (message: string) => void
}): Promise<SoakSessionResult> {
  const {browser, running, scenario, instrumentation, minutes} = options
  const config = {...DEFAULT_SESSION_CONFIG, ...options.config}
  const log = options.log ?? (() => {})
  const plan = scenario.soak
  const target = soakTypingTarget(scenario)

  running.mock.hub.closeAll()
  running.mock.store.reset()
  running.mock.ledger.reset()
  running.mock.store.seed(scenarioFixture(scenario))
  if (plan?.presence) {
    running.mock.presence.setLive(plan.presence.peer)
  }

  const session = await createSessionContext(browser, running.side, running.studioUrl, {
    cpuThrottleRate: config.cpuThrottleRate,
  })
  const {context, page} = session
  function diagnostics(): string[] {
    return [...session.consoleErrors, ...session.pageErrors]
  }

  try {
    await page.addInitScript(instrumentation)
    await gotoScenario(page, running.studioUrl, scenario, config.readinessTimeoutMs)
    await awaitReadiness(page, scenario, {
      timeoutMs: config.readinessTimeoutMs,
      diagnostics,
    })

    await focusField(page, target, config.readinessTimeoutMs)
    // Flush boot + focus-click interaction entries so the first interval's
    // latency accounting starts clean
    await drainEntries(page)

    const samples: SoakSample[] = []
    // Per-interval accumulators, reset at every sample
    let intervalLatencies: number[] = []
    let lastCpu = await readCpuMetrics(session.cdp)
    let lastRequestCount = running.mock.ledger.snapshot().entries.length

    const takeSample = async (minute: number) => {
      const memory = await readMemorySnapshot(session.cdp)
      if (memory === null) return
      const cpu = await readCpuMetrics(session.cdp)
      const cpuTaskMs =
        cpu && lastCpu ? Math.round((cpu.taskDuration - lastCpu.taskDuration) * 1000) : null
      lastCpu = cpu
      const requestCount = running.mock.ledger.snapshot().entries.length
      const requests = requestCount - lastRequestCount
      lastRequestCount = requestCount
      const latencyP50Ms = intervalLatencies.length > 0 ? median(intervalLatencies) : null
      intervalLatencies = []
      const connections = running.mock.hub.connectionCount
      samples.push({
        minute,
        ...memory,
        latencyP50Ms,
        cpuTaskMs,
        connections,
        requests,
      })
      log(
        `  minute ${minute}: heap ${memory.heapMb.toFixed(1)} MB, ${memory.domNodes} nodes, ` +
          `${memory.listeners} listeners, p50 ${latencyP50Ms === null ? '—' : `${latencyP50Ms.toFixed(0)}ms`}, ` +
          `cpu ${cpuTaskMs === null ? '—' : `${cpuTaskMs}ms`}, ${connections} connection(s), ${requests} request(s)`,
      )
    }

    await takeSample(0)
    const deadline = Date.now() + minutes * 60_000
    let nextSampleAt = Date.now() + 60_000
    const interruptions: ReadOnlyInterruptions = {count: 0, totalMs: 0}
    let offset = 0
    let cycle = 0
    // One excursion per cycle, and a cycle takes several seconds: one per
    // second is a schedule the loop can never outrun
    const schedule = plan
      ? soakExcursionSchedule(plan.excursions.length, plan.seed, minutes * 60)
      : []

    while (Date.now() < deadline) {
      if (plan) {
        await runExcursion({
          page,
          running,
          plan,
          excursionIndex: schedule[cycle % schedule.length],
          target,
          interruptions,
          diagnostics,
        })
      }
      // Bounded workload: type a burst, then clear it
      await typeKeystrokes(page, BURST_KEYSTROKES, config.burstCadenceMs, offset, interruptions)
      offset += BURST_KEYSTROKES
      const entries = await drainEntries(page)
      intervalLatencies.push(...toLatencies(entries, BURST_KEYSTROKES).samples)
      await eraseBurst(page, target, config.burstCadenceMs, interruptions)
      // The clear is interaction traffic too — drain and discard so it never
      // pollutes the next interval's latency accounting
      await drainEntries(page)
      await page.waitForTimeout(300)
      cycle += 1

      if (Date.now() >= nextSampleAt) {
        await takeSample(Math.round((Date.now() - (deadline - minutes * 60_000)) / 60_000))
        nextSampleAt += 60_000
      }
    }
    // Final sample, unless the loop's last iteration already took it
    if (samples.at(-1)?.minute !== minutes) {
      await takeSample(minutes)
    }
    if (plan) {
      log(`  ${cycle} cycles, each one excursion + a ${BURST_KEYSTROKES}-keystroke burst`)
    }

    if (session.violations.length > 0) {
      throw new SessionError(
        'hermeticity-violation',
        session.violations.join(', '),
        HERMETICITY_HINT,
      )
    }
    if (session.pageErrors.length > 0) {
      throw new SessionError('page-error', session.pageErrors.join('\n'))
    }
    if (session.consoleErrors.length > 0) {
      throw new SessionError('console-error', session.consoleErrors.join('\n'), session.httpErrors)
    }

    return {minutes, settleMinute: soakSettleMinuteFor(scenario, minutes), samples, interruptions}
  } finally {
    await context.close()
    running.mock.presence.reset()
  }
}

/**
 * One excursion, then back to typing: move the presence peer, refocus the
 * target (an excursion takes focus away, and a document switch remounts the
 * form) and drop the excursion's own interactions from latency accounting.
 */
async function runExcursion(options: {
  page: Page
  running: RunningSide
  plan: SoakPlan
  excursionIndex: number
  target: InteractionTarget
  interruptions: ReadOnlyInterruptions
  diagnostics: () => string[]
}): Promise<void> {
  const {page, running, plan, excursionIndex, target, interruptions, diagnostics} = options
  const excursion = plan.excursions[excursionIndex]
  for (const [index, step] of excursion.steps.entries()) {
    await runStep(
      {
        page,
        running,
        timeoutMs: STEP_TIMEOUT_MS,
        interruptions,
        label: `soak excursion "${excursion.label}"`,
        diagnostics,
      },
      step,
    ).catch((error: unknown) => {
      const cause = error instanceof Error ? error.message : String(error)
      // One line: CI turns it into the failure annotation
      throw new SessionError(
        'soak-excursion',
        `excursion "${excursion.label}" failed at step ${index + 1} (${step.kind}): ${cause.split('\n')[0]}`,
        error instanceof SessionError ? error.diagnostics : diagnostics(),
      )
    })
  }
  running.mock.presence.advancePeer()
  await focusField(page, target, STEP_TIMEOUT_MS)
  await drainEntries(page)
}
