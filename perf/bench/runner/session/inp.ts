import {type Browser} from 'playwright'

import {type BenchEntries} from '../../instrumentation/types'
import {type BenchScenario} from '../../scenarios/types'
import {computeInp, INP_MIN_INTERACTIONS, type InpResult} from '../../stats/inp'
import {createSessionContext} from '../browser'
import {type RunningSide} from '../servers'
import {
  DEFAULT_SESSION_CONFIG,
  drainEntries,
  focusField,
  HERMETICITY_HINT,
  interactionMaxDurations,
  type ReadOnlyInterruptions,
  type SessionConfig,
  SessionError,
} from './interaction'
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
  /** Safety cap so a session that stops producing entries can't run forever. */
  maxRounds: number
}

export const DEFAULT_INP_CONFIG: InpConfig = {
  cpuThrottleRate: DEFAULT_SESSION_CONFIG.cpuThrottleRate,
  targetInteractions: 60,
  maxRounds: 40,
}

/**
 * INP session: boot to an editable document, then run a *realistic mix* of
 * interactions — not just steady typing. Each round clicks a field (a pointer
 * interaction), types a short burst (keyboard interactions), and moves on;
 * cycling through every field of the scenario. INP is dominated by the worst
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

  running.mock.setActiveFeatures(scenario.features ?? [])
  running.mock.hub.closeAll()
  running.mock.store.reset()
  running.mock.ledger.reset()
  running.mock.store.seed(scenario.fixture())

  const session = await createSessionContext(browser, running.side, running.studioUrl, {
    cpuThrottleRate: config.cpuThrottleRate,
  })
  const {context, page} = session

  try {
    await page.addInitScript(instrumentation)
    await page.goto(
      `${running.studioUrl}/${scenario.workspace ?? scenario.name}/intent/edit/id=${encodeURIComponent(scenario.documentId)};type=${encodeURIComponent(scenario.documentType)}`,
      {waitUntil: 'domcontentloaded', timeout: DEFAULT_SESSION_CONFIG.readinessTimeoutMs},
    )
    await page
      .locator('[data-testid="form-view"]:not([data-read-only="true"])')
      .waitFor({state: 'visible', timeout: DEFAULT_SESSION_CONFIG.readinessTimeoutMs})
      .catch(() => {
        throw new SessionError('readiness-timeout', 'form-view never became editable', [
          ...session.consoleErrors,
          ...session.pageErrors,
        ])
      })

    // Discard everything from boot — INP measures interactions, not load.
    await focusField(page, scenario.interactions[0], DEFAULT_SESSION_CONFIG.readinessTimeoutMs)
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
    // A step scenario's sequence is an atomic choreography (e.g. open a comment
    // composer, type, send) - breaking mid-sequence would skip its terminal
    // step, so those run each pass to completion and check the target only at a
    // pass boundary. Field-only scenarios keep the per-step break unchanged.
    const runToCompletion = scenario.steps !== undefined

    // Cycle through the scenario's steps, draining after each so a single
    // step's rendering can't be double-counted. Fail fast on page/console
    // errors instead of burning the whole budget.
    for (let round = 0; round < config.maxRounds && driven < config.targetInteractions; ) {
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
        const {interactions} = await runStep(
          {page, running, timeoutMs: 30_000, interruptions},
          step,
        )
        driven += interactions
        const entries: BenchEntries = await drainEntries(page)
        latencies.push(...interactionMaxDurations(entries))
        round += 1
        if (runToCompletion) continue
        if (driven >= config.targetInteractions || round >= config.maxRounds) break
      }
    }

    const oracles = steps.flatMap((step) => ('oracle' in step && step.oracle ? [step.oracle] : []))
    if (oracles.length > 0) {
      const deadline = Date.now() + DEFAULT_SESSION_CONFIG.readbackTimeoutMs
      for (;;) {
        const allSatisfied = oracles.every((oracle) => oracle(running.mock.store))
        if (allSatisfied) break
        if (Date.now() > deadline) {
          throw new SessionError(
            'readback-mismatch',
            'step oracle(s) not satisfied before deadline',
          )
        }
        await new Promise((resolve) => setTimeout(resolve, 250))
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
