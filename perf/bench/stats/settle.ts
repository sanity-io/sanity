/**
 * Pure quiescence logic for settle mode — the session (runner/session/
 * settle.ts) polls the page, converts drained entries to activity
 * timestamps, and asks this function whether the page has settled. Kept
 * pure and clock-agnostic so the boundary cases (loops, stragglers, the
 * cap) are unit-testable without a browser.
 *
 * All timestamps share one clock (the page's `performance.now()`).
 */

export interface SettleWindowConfig {
  /** How long the page must stay quiet to count as settled. */
  quietWindowMs: number
  /**
   * Give-up cap, measured from readiness: a genuine render loop never goes
   * quiet, so past this the verdict is `settled: false` — reported as data,
   * not thrown (see the session's outcome semantics).
   */
  maxSettleMs: number
  /**
   * Activity events tolerated inside the quiet window before it stops
   * counting as quiet. 0 by default; a per-scenario escape hatch for a
   * legitimate periodic ticker discovered during burn-in.
   */
  activityFloor: number
}

export const DEFAULT_SETTLE_WINDOW: SettleWindowConfig = {
  quietWindowMs: 3_000,
  maxSettleMs: 30_000,
  activityFloor: 0,
}

export interface SettleComputation {
  /** Quiet for a full window (and the window has fully elapsed since readiness). */
  settled: boolean
  /**
   * Readiness → last activity outside the tolerated stragglers; 0 when the
   * page was born quiet. Only meaningful once `settled` (null otherwise).
   */
  settleTimeMs: number | null
  /** The cap elapsed without a quiet window. */
  timedOut: boolean
}

/**
 * Evaluate quiescence at time `nowMs`, given every activity timestamp
 * observed since `readinessAt`. Timestamps at or before `readinessAt` are
 * ignored (boot noise the session should already have drained).
 */
export function computeSettle(options: {
  activityTimestamps: number[]
  readinessAt: number
  nowMs: number
  config?: Partial<SettleWindowConfig>
}): SettleComputation {
  const {activityTimestamps, readinessAt, nowMs} = options
  const config = {...DEFAULT_SETTLE_WINDOW, ...options.config}

  const relevant = activityTimestamps.filter((timestamp) => timestamp > readinessAt)
  const windowStart = nowMs - config.quietWindowMs
  const inWindow = relevant.filter((timestamp) => timestamp > windowStart)

  const quiet = inWindow.length <= config.activityFloor
  // A page can't be settled before one full quiet window has even elapsed.
  const windowElapsed = nowMs - readinessAt >= config.quietWindowMs

  if (quiet && windowElapsed) {
    // Stragglers tolerated by activityFloor are noise — settle time is the
    // last activity BEFORE the quiet window.
    const beforeWindow = relevant.filter((timestamp) => timestamp <= windowStart)
    const lastActivity = beforeWindow.length > 0 ? Math.max(...beforeWindow) : readinessAt
    return {settled: true, settleTimeMs: Math.max(0, lastActivity - readinessAt), timedOut: false}
  }

  return {
    settled: false,
    settleTimeMs: null,
    timedOut: nowMs - readinessAt >= config.maxSettleMs,
  }
}

/**
 * The single definition of "the scenario's settle sessions contradict its
 * declared expectation": an expected-green scenario must settle EVERY
 * session; an expected-red one that settles unanimously means the footgun is
 * fixed and the flag is stale. Shared by the CLI (exit code) and the
 * markdown report (⚠️ marker) so the rule can't drift between them.
 */
export function settleMismatch(options: {
  expectedToSettle: boolean
  settledCount: number
  sessionCount: number
}): boolean {
  const {expectedToSettle, settledCount, sessionCount} = options
  if (sessionCount === 0) return false
  return expectedToSettle ? settledCount < sessionCount : settledCount === sessionCount
}
