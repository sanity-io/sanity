import {type DiffInterval} from './bootstrap'

export type Verdict = 'regression' | 'improvement' | 'neutral' | 'inconclusive'

export interface GateThresholds {
  /** Minimum absolute difference (ms) to matter. */
  absMs: number
  /** Minimum relative difference (fraction of the reference median). */
  rel: number
  /** CI half-width below which sampling may stop (see shouldStop). */
  targetHalfWidthMs: number
}

/**
 * Interaction latency: differences of one Event Timing duration-granularity
 * step (8ms) or under 5% are noise.
 *
 * The absolute floor must sit strictly ABOVE one 8ms granularity step, because
 * 8ms is the smallest non-zero difference the browser can report at all. With
 * the old `absMs: 3`, a single quantisation step cleared the floor on every
 * metric whose median was under 160ms, so two identical builds gated as a
 * regression whenever their samples happened to land one step apart — observed
 * on the self-test (`article/body`, median 56ms: Δ+8.0ms [+4.0, +8.0] 🔴).
 * `gate` compares with `>=`, so the floor is 16ms (= two steps, and the same
 * value as OBSERVABILITY_FLOOR_MS) rather than 8: one step is never a verdict,
 * two always are.
 *
 * targetHalfWidthMs matches, for the same reason — a convergence target finer
 * than the instrument's resolution can never be reached, so sampling ran to
 * budget exhaustion and reported `inconclusive` instead of stopping early.
 */
export const INTERACTION_THRESHOLDS: GateThresholds = {
  absMs: 16,
  rel: 0.05,
  targetHalfWidthMs: 8,
}

/** Load metrics (time-to-editable/LCP): sub-100ms or sub-8% differences don't matter. */
export const PAGELOAD_THRESHOLDS: GateThresholds = {
  absMs: 100,
  rel: 0.08,
  targetHalfWidthMs: 120,
}

/**
 * Verdict rule: a difference is real only when the CI excludes zero AND the
 * point estimate exceeds both threshold floors. `inconclusive` (CI too wide
 * to decide at these thresholds when the budget ran out) is distinct from
 * `neutral` — a noisy run must never read as a pass/fail coin-flip (README:
 * flake resistance §2). Gating treats inconclusive as neutral.
 */
export function gate(
  interval: DiffInterval,
  referenceMedian: number,
  thresholds: GateThresholds,
): Verdict {
  const minimumEffect = Math.max(thresholds.absMs, thresholds.rel * referenceMedian)

  if (interval.lo > 0 && interval.diff >= minimumEffect) {
    return 'regression'
  }
  if (interval.hi < 0 && -interval.diff >= minimumEffect) {
    return 'improvement'
  }
  // CI includes zero (or the effect is below the floors). If the interval is
  // still so wide that a meaningful effect could hide inside it, we simply
  // don't know.
  const halfWidth = (interval.hi - interval.lo) / 2
  if (halfWidth > Math.max(thresholds.targetHalfWidthMs, minimumEffect)) {
    return 'inconclusive'
  }
  return 'neutral'
}

/**
 * Did the gate actually decide an effect? True only for `regression` and
 * `improvement`.
 *
 * This is the predicate behind `--fail-on-verdict` (the self-test), and it
 * deliberately excludes `inconclusive`: gate() treats inconclusive as neutral
 * and the PR report counts it under "no regressions", so failing on it would
 * make ordinary CI noise — the very thing inconclusive exists to absorb — read
 * as harness drift.
 */
export function isDecidedVerdict(verdict: Verdict | undefined): boolean {
  return verdict === 'regression' || verdict === 'improvement'
}

/**
 * Dynamic stopping: stop sampling once the CI is tight enough to decide —
 * the exact complement of gate()'s `inconclusive` boundary, so a run that
 * stopped as "converged" can never gate inconclusive.
 */
export function shouldStop(
  interval: DiffInterval,
  referenceMedian: number,
  thresholds: GateThresholds,
): boolean {
  const minimumEffect = Math.max(thresholds.absMs, thresholds.rel * referenceMedian)
  const halfWidth = (interval.hi - interval.lo) / 2
  return halfWidth <= Math.max(thresholds.targetHalfWidthMs, minimumEffect)
}
