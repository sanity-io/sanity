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
  typeKeystrokes,
} from './interaction'

export interface InpSessionResult extends InpResult {
  /** All per-interaction latencies collected, for reporting/percentiles. */
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
 * going until enough distinct interactions accumulate for the percentile rule,
 * then computes INP from all of them (web-vitals' own algorithm — see
 * stats/inp.ts). One page load, one browser clock; the runner only orchestrates.
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
    let offset = 0

    // Cycle through the scenario's fields, one click + short burst per field,
    // draining after each so a single field's rendering can't be double-counted.
    // Fail fast on page/console errors instead of burning the whole budget.
    for (
      let round = 0;
      round < config.maxRounds && latencies.length < config.targetInteractions;
    ) {
      for (const target of scenario.interactions) {
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
        // The click is itself an interaction (pointerdown/up + click share an
        // interactionId); focusField clicks the field root and the input.
        await focusField(page, target, 30_000)
        // A short burst, isolated cadence so each keystroke is its own
        // interaction (the Event Timing observer needs a paint between them).
        await typeKeystrokes(
          page,
          4,
          DEFAULT_SESSION_CONFIG.isolatedCadenceMs,
          offset,
          interruptions,
        )
        offset += 4
        const entries: BenchEntries = await drainEntries(page)
        latencies.push(...interactionMaxDurations(entries))
        round += 1
        if (latencies.length >= config.targetInteractions || round >= config.maxRounds) break
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
    if (latencies.length < INP_MIN_INTERACTIONS) {
      // Below the reportable threshold means the interaction mix produced too
      // few observable entries (everything under the 16ms floor, or the field
      // set is tiny) — a measurement failure, not a fast studio.
      throw new SessionError(
        'sample-count-mismatch',
        `only ${latencies.length} observable interactions (need >= ${INP_MIN_INTERACTIONS} for INP)`,
      )
    }

    return {...computeInp(latencies), latencies, readOnlyInterruptions: interruptions}
  } finally {
    await context.close()
  }
}
