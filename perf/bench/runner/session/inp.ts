import {type Browser} from 'playwright'

import {type BenchEntries} from '../../instrumentation/types'
import {type BenchScenario} from '../../scenarios/types'
import {computeInp, INP_MIN_INTERACTIONS, type InpResult} from '../../stats/inp'
import {createSessionContext} from '../browser'
import {type RunningSide} from '../servers'
import {SessionError} from './errors'
import {
  DEFAULT_SESSION_CONFIG,
  drainEntries,
  focusField,
  HERMETICITY_HINT,
  interactionMaxDurations,
  type ReadOnlyInterruptions,
  type SessionConfig,
  unexpectedEndpointHint,
} from './interaction'
import {awaitReadiness, gotoScenario} from './navigation'
import {resetMockForScenario} from './seed'
import {runStep, toTypeStep} from './steps'

export interface InpSessionResult extends InpResult {
  /**
   * All observed per-interaction latencies, for reporting/percentiles. Can be
   * shorter than `interactionCount`: interactions faster than the Event
   * Timing observability floor produce no entry.
   */
  latencies: number[]
  readOnlyInterruptions: ReadOnlyInterruptions
}

export interface InpConfig extends Pick<SessionConfig, 'cpuThrottleRate'> {
  /**
   * How many distinct interactions to drive before stopping. The web-vitals
   * percentile rule needs >= 50 to be reportable, so aim comfortably above it.
   */
  targetInteractions: number
  /**
   * Safety cap so a session that stops producing entries can't run forever.
   * Counts field visits for field-only scenarios and full passes for step
   * scenarios, whose steps can drive no interactions at all (scroll, hover,
   * awaitVisible) and would otherwise spend the budget without driving any.
   */
  maxRounds: number
}

export const DEFAULT_INP_CONFIG: InpConfig = {
  cpuThrottleRate: DEFAULT_SESSION_CONFIG.cpuThrottleRate,
  targetInteractions: 60,
  maxRounds: 40,
}

/**
 * INP session: boot to an editable document, then run a *realistic mix* of
 * interactions — not just steady typing. By default each round clicks a field
 * (a pointer interaction), types a short burst (keyboard interactions), and
 * moves on, cycling through every field of the scenario; a scenario with
 * `steps` runs its own choreography instead (clicks, hovers, scrolls, key
 * presses, typing — see runner/session/steps.ts). INP is dominated by the worst
 * interaction, which in practice is a click that triggers layout/render work,
 * so the pointer interactions matter as much as the keystrokes. The loop keeps
 * going until enough interactions have been *driven* for the percentile rule,
 * then computes INP from the observed entries plus the driven total
 * (web-vitals' own algorithm — see stats/inp.ts). One page load, one browser
 * clock; the runner only orchestrates.
 */
export async function runInpSession(options: {
  browser: Browser
  running: RunningSide
  scenario: BenchScenario
  instrumentation: string
  config?: Partial<InpConfig>
}): Promise<InpSessionResult> {
  const {browser, running, scenario, instrumentation} = options
  const config = {...DEFAULT_INP_CONFIG, ...options.config}

  resetMockForScenario(running, scenario)

  const session = await createSessionContext(browser, running.side, running.studioUrl, {
    cpuThrottleRate: config.cpuThrottleRate,
  })
  const {context, page} = session

  try {
    await page.addInitScript(instrumentation)
    await gotoScenario(page, running.studioUrl, scenario, DEFAULT_SESSION_CONFIG.readinessTimeoutMs)
    await awaitReadiness(page, scenario, {
      timeoutMs: DEFAULT_SESSION_CONFIG.readinessTimeoutMs,
      diagnostics: () => [...session.consoleErrors, ...session.pageErrors],
    })

    // Discard everything from boot — INP measures interactions, not load.
    // Step scenarios may have nothing to type into; their first step focuses.
    if (scenario.interactions.length > 0) {
      await focusField(page, scenario.interactions[0], DEFAULT_SESSION_CONFIG.readinessTimeoutMs)
    }
    await drainEntries(page)

    const interruptions: ReadOnlyInterruptions = {count: 0, totalMs: 0}
    const latencies: number[] = []
    // Total interactions driven (clicks + keystrokes). Event Timing can't
    // observe interactions faster than the ~16ms floor, so `latencies`
    // undercounts — the percentile index must come from this total (the
    // web-vitals performance.interactionCount), or INP would drop when a
    // regression pushes below-floor interactions over the floor.
    let driven = 0

    const steps = scenario.steps ?? scenario.interactions.map(toTypeStep)
    // A step scenario's sequence is one choreography (open a panel, focus a
    // field, scroll, type): breaking mid-sequence would skip its later steps
    // every pass, and one step can cost more than the budget left, so those
    // run each pass to completion and check the target only at a pass
    // boundary. Field-only scenarios keep the per-field break.
    const runToCompletion = scenario.steps !== undefined

    // Cycle through the steps, draining after each so a single step's
    // rendering can't be double-counted. Fail fast on page/console errors
    // instead of burning the whole budget.
    for (let round = 0; round < config.maxRounds && driven < config.targetInteractions;) {
      for (const step of steps) {
        if (session.pageErrors.length > 0) {
          throw new SessionError('page-error', session.pageErrors.join('\n'))
        }
        if (session.consoleErrors.length > 0) {
          throw new SessionError(
            'console-error',
            session.consoleErrors.join('\n'),
            session.httpErrors,
          )
        }
        // Clicks are interactions too (pointerdown/up + click share an
        // interactionId); each step reports what it drove.
        const {interactions} = await runStep(
          {page, running, timeoutMs: 30_000, interruptions},
          step,
        )
        driven += interactions
        const entries: BenchEntries = await drainEntries(page)
        latencies.push(...interactionMaxDurations(entries))
        if (runToCompletion) continue
        round += 1
        if (driven >= config.targetInteractions || round >= config.maxRounds) break
      }
      if (runToCompletion) round += 1
    }

    // Before the readback wait, not after: an endpoint the mock lacks would otherwise
    // surface as an anonymous readback timeout.
    const ledgerSnapshot = running.mock.ledger.snapshot()
    if (ledgerSnapshot.unexpected.length > 0) {
      throw new SessionError(
        'unexpected-endpoint',
        ledgerSnapshot.unexpected.map((entry) => `${entry.method} ${entry.path}`).join(', '),
        unexpectedEndpointHint(ledgerSnapshot.unexpected.map((entry) => entry.path)),
      )
    }

    // Step readback: every declared check must see its effect in the mock's store.
    const readbacks = steps.flatMap((step) =>
      'readback' in step && step.readback ? [step.readback] : [],
    )
    if (readbacks.length > 0) {
      const deadline = Date.now() + DEFAULT_SESSION_CONFIG.readbackTimeoutMs
      while (!readbacks.every((readback) => readback(running.mock.store))) {
        if (session.pageErrors.length > 0) {
          throw new SessionError('page-error', session.pageErrors.join('\n'))
        }
        if (session.consoleErrors.length > 0) {
          throw new SessionError(
            'console-error',
            session.consoleErrors.join('\n'),
            session.httpErrors,
          )
        }
        if (Date.now() > deadline) {
          throw new SessionError('readback-mismatch', 'step readback not satisfied before deadline')
        }
        await page.waitForTimeout(250)
      }
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
    if (driven < INP_MIN_INTERACTIONS) {
      // The session stopped (maxRounds) before driving enough interactions
      // for the percentile rule — a configuration failure, not a fast studio.
      throw new SessionError(
        'sample-count-mismatch',
        `only ${driven} interactions driven (need >= ${INP_MIN_INTERACTIONS} for INP)`,
      )
    }
    if (latencies.length === 0) {
      // Zero observable entries across >= 50 driven interactions means the
      // Event Timing observer isn't reporting — studio clicks under CPU
      // throttle never all finish below the observability floor.
      throw new SessionError(
        'sample-count-mismatch',
        `no observable interactions across ${driven} driven`,
      )
    }

    return {...computeInp(latencies, driven), latencies, readOnlyInterruptions: interruptions}
  } finally {
    await context.close()
  }
}
