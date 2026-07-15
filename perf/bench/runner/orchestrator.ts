import {type Browser} from 'playwright'

import {type BenchScenario} from '../scenarios/types'
import {bootstrapDiffOfMedians, type DiffInterval} from '../stats/bootstrap'
import {gate, INTERACTION_THRESHOLDS, shouldStop, type Verdict} from '../stats/gate'
import {median} from '../stats/quantiles'
import {type Rng} from '../stats/rng'
import {type RunningSide} from './servers'
import {
  type InteractionSessionResult,
  runInteractionSession,
  type SessionConfig,
  SessionError,
} from './session/interaction'

export interface OrchestratorConfig {
  minSessionsPerSide: number
  maxSessionsPerSide: number
  /** Wall-clock budget (cap, not duration — the stopping rule exits early). */
  budgetMs: number
  /** Consecutive failures on one side that abort the scenario. */
  maxConsecutiveFailures: number
  sessionConfig: Partial<SessionConfig>
}

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  minSessionsPerSide: 6,
  maxSessionsPerSide: 20,
  budgetMs: 8 * 60_000,
  maxConsecutiveFailures: 3,
  sessionConfig: {},
}

export interface SessionFailure {
  side: 'reference' | 'experiment'
  reason: string
  message: string
}

export interface FieldComparison {
  label: string
  interval: DiffInterval
  referenceMedian: number
  experimentMedian: number
  verdict: Verdict
}

export interface AbScenarioResult {
  scenario: string
  mode: 'ab'
  comparisons: FieldComparison[]
  reference: SideAggregation
  experiment: SideAggregation
  /** Why sampling stopped: converged, budget, or max sessions. */
  stoppedBy: 'converged' | 'budget' | 'max-sessions'
  failures: SessionFailure[]
}

export interface SideAggregation {
  sessions: InteractionSessionResult[]
  /** Per-field per-session isolated samples (bootstrap input). */
  fieldSessions: Map<string, number[][]>
}

function aggregate(sessions: InteractionSessionResult[]): SideAggregation {
  const fieldSessions = new Map<string, number[][]>()
  for (const session of sessions) {
    for (const field of session.fields) {
      const existing = fieldSessions.get(field.label) ?? []
      existing.push(field.samples)
      fieldSessions.set(field.label, existing)
    }
  }
  return {sessions, fieldSessions}
}

/**
 * Interleaved A/B sampling with dynamic stopping (tachometer-style):
 * alternate reference/experiment sessions on the same browser, and after
 * each side has `minSessionsPerSide`, stop as soon as every field's
 * bootstrap CI is tight enough to decide — or when the budget/max-session
 * cap is hit (in which case wide CIs surface as `inconclusive`, never as a
 * coin-flip verdict). Failed sessions are discarded, logged, and retried;
 * `maxConsecutiveFailures` on a side aborts the scenario hard.
 */
export async function runAbScenario(options: {
  browser: Browser
  scenario: BenchScenario
  reference: RunningSide
  experiment: RunningSide
  instrumentation: string
  rng: Rng
  config?: Partial<OrchestratorConfig>
  log?: (message: string) => void
}): Promise<AbScenarioResult> {
  const {browser, scenario, reference, experiment, instrumentation, rng} = options
  const config = {...DEFAULT_ORCHESTRATOR_CONFIG, ...options.config}
  const log = options.log ?? (() => {})

  const startedAt = Date.now()
  const referenceSessions: InteractionSessionResult[] = []
  const experimentSessions: InteractionSessionResult[] = []
  const failures: SessionFailure[] = []
  const consecutiveFailures = {reference: 0, experiment: 0}
  let stoppedBy: AbScenarioResult['stoppedBy'] = 'converged'
  // The comparisons that decided to stop are the ones reported: `rng` is a
  // stateful stream, so recomputing after the loop would draw a *different*
  // bootstrap interval than the one that satisfied shouldStop (a run could
  // then claim "converged" yet report an inconclusive-width interval)
  let comparisons: FieldComparison[] | undefined

  const runOne = async (side: 'reference' | 'experiment'): Promise<void> => {
    const running = side === 'reference' ? reference : experiment
    const bucket = side === 'reference' ? referenceSessions : experimentSessions
    for (;;) {
      try {
        const result = await runInteractionSession({
          browser,
          running,
          scenario,
          instrumentation,
          config: config.sessionConfig,
        })
        bucket.push(result)
        consecutiveFailures[side] = 0
        return
      } catch (error) {
        const reason = error instanceof SessionError ? error.reason : 'unknown'
        const message = error instanceof Error ? error.message : String(error)
        const diagnostics = error instanceof SessionError ? error.diagnostics.slice(0, 5) : []
        failures.push({side, reason, message})
        consecutiveFailures[side] += 1
        log(
          `  ${side} session failed (${reason}), retrying — ${message.slice(0, 200)}` +
            (diagnostics.length > 0 ? `\n    ${diagnostics.join('\n    ')}` : ''),
        )
        if (consecutiveFailures[side] >= config.maxConsecutiveFailures) {
          throw new Error(
            `Aborting scenario "${scenario.name}": ${consecutiveFailures[side]} consecutive ${side} session failures (last: ${message})` +
              (diagnostics.length > 0 ? `\n${diagnostics.join('\n')}` : ''),
            {cause: error},
          )
        }
      }
    }
  }

  const compare = (): FieldComparison[] => {
    const referenceAggregation = aggregate(referenceSessions)
    const experimentAggregation = aggregate(experimentSessions)
    return [...referenceAggregation.fieldSessions.keys()].map((label) => {
      const aSessions = referenceAggregation.fieldSessions.get(label) ?? []
      const bSessions = experimentAggregation.fieldSessions.get(label) ?? []
      const interval = bootstrapDiffOfMedians({aSessions, bSessions, rng})
      const referenceMedian = median(aSessions.flat())
      return {
        label,
        interval,
        referenceMedian,
        experimentMedian: median(bSessions.flat()),
        verdict: gate(interval, referenceMedian, INTERACTION_THRESHOLDS),
      }
    })
  }

  for (let round = 0; round < config.maxSessionsPerSide; round++) {
    // Alternate which side goes first each round so neither side
    // systematically samples earlier (warmier caches, quieter host)
    const order: ('reference' | 'experiment')[] =
      round % 2 === 0 ? ['reference', 'experiment'] : ['experiment', 'reference']
    for (const side of order) {
      await runOne(side)
    }
    log(
      `  round ${round + 1}: ${referenceSessions.length} reference / ${experimentSessions.length} experiment sessions (${((Date.now() - startedAt) / 1000).toFixed(0)}s)`,
    )

    if (referenceSessions.length >= config.minSessionsPerSide) {
      comparisons = compare()
      const converged = comparisons.every((comparison) =>
        shouldStop(comparison.interval, comparison.referenceMedian, INTERACTION_THRESHOLDS),
      )
      if (converged) {
        stoppedBy = 'converged'
        break
      }
    }
    if (Date.now() - startedAt > config.budgetMs) {
      stoppedBy = 'budget'
      break
    }
    if (round === config.maxSessionsPerSide - 1) {
      stoppedBy = 'max-sessions'
    }
  }

  return {
    scenario: scenario.name,
    mode: 'ab',
    // Only recompute when the loop exited before any comparison was made
    // (budget hit below minSessionsPerSide)
    comparisons: comparisons ?? compare(),
    reference: aggregate(referenceSessions),
    experiment: aggregate(experimentSessions),
    stoppedBy,
    failures,
  }
}
