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

/** Interaction latency: differences under ~one duration-granularity step or 5% are noise. */
export const INTERACTION_THRESHOLDS: GateThresholds = {
  absMs: 3,
  rel: 0.05,
  targetHalfWidthMs: 4,
}

/** Load metrics (time-to-editable/LCP): sub-100ms or sub-8% differences don't matter. */
export const PAGELOAD_THRESHOLDS: GateThresholds = {
  absMs: 100,
  rel: 0.08,
  targetHalfWidthMs: 120,
}

/**
 * INP: one value/session, so a per-PR A/B is coarse (see P2 doc) — kept
 * report-only and never gates CI, so these floors are deliberately looser
 * than pageload's to avoid reading session noise as a real regression.
 */
export const INP_THRESHOLDS: GateThresholds = {
  absMs: 150,
  rel: 0.15,
  targetHalfWidthMs: 150,
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
