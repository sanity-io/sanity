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
  padToFloor,
  type ReadOnlyInterruptions,
  type SessionConfig,
  SessionError,
  typeBurst,
} from './interaction'

export interface LabelledLatencies {
  label: string
  latencies: number[]
}

export interface InpSessionResult extends InpResult {
  /**
   * All observed per-interaction latencies, for reporting/percentiles. Can be
   * shorter than `interactionCount`: interactions faster than the Event
   * Timing observability floor produce no entry.
   */
  latencies: number[]
  /** Per-field breakdown of the same latencies, floor-padded (see padToFloor). */
  perLabel: LabelledLatencies[]
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
    const keystrokesPerField = 4
    let offset = 0
    const byLabel = new Map<string, {observed: number[]; driven: number}>()

    // Cycle through the scenario's fields, one click + short burst per field,
    // draining after each so a single field's rendering can't be double-counted.
    // Fail fast on page/console errors instead of burning the whole budget.
    for (let round = 0; round < config.maxRounds && driven < config.targetInteractions;) {
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
        const {clicks} = await focusField(page, target, 30_000)
        // A short burst, isolated cadence so each keystroke is its own
        // interaction (the Event Timing observer needs a paint between them).
        // typeBurst gates read-only once per field, not per keystroke — a
        // per-keystroke in-page round-trip would serialize dispatch behind
        // the main thread and suppress INP's input-delay component.
        await typeBurst(
          page,
          keystrokesPerField,
          DEFAULT_SESSION_CONFIG.isolatedCadenceMs,
          offset,
          interruptions,
        )
        offset += keystrokesPerField
        const fieldDriven = clicks + keystrokesPerField
        driven += fieldDriven
        const entries: BenchEntries = await drainEntries(page)
        const fieldLatencies = interactionMaxDurations(entries)
        latencies.push(...fieldLatencies)
        const label = target.label ?? target.fieldPath
        const labelEntry = byLabel.get(label) ?? {observed: [], driven: 0}
        labelEntry.observed.push(...fieldLatencies)
        labelEntry.driven += fieldDriven
        byLabel.set(label, labelEntry)
        round += 1
        if (driven >= config.targetInteractions || round >= config.maxRounds) break
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

    const perLabel: LabelledLatencies[] = [...byLabel.entries()].map(([label, entry]) => ({
      label,
      latencies: padToFloor(entry.observed, entry.driven),
    }))

    return {
      ...computeInp(latencies, driven),
      latencies,
      perLabel,
      readOnlyInterruptions: interruptions,
    }
  } finally {
    await context.close()
  }
}
