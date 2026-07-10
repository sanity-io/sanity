import {type TrustTier} from './types'

export interface TtccPoint {
  week: string
  ttccMedianHours: number
  ttccP90Hours: number
  ccfrPercent: number
}

export type FiveCPhase = 'Comprehend' | 'Compose' | 'Check' | 'Commit' | 'Confirm'

export interface FiveCDwell {
  phase: FiveCPhase
  hours: number
}

/**
 * Starting point per tier. Higher tiers commit faster (lower TTCC) but carry
 * slightly more change-failure risk to work off.
 */
const TIER_BASELINE: Record<TrustTier, {median: number; p90: number; ccfr: number}> = {
  T0: {median: 48, p90: 96, ccfr: 1.5},
  T1: {median: 30, p90: 68, ccfr: 2.2},
  T2: {median: 16, p90: 40, ccfr: 3.4},
  T3: {median: 6, p90: 18, ccfr: 4.6},
}

const FIVE_C_PHASES: readonly FiveCPhase[] = ['Comprehend', 'Compose', 'Check', 'Commit', 'Confirm']

const PHASE_WEIGHTS: Record<FiveCPhase, number> = {
  Comprehend: 0.22,
  Compose: 0.3,
  Check: 0.28,
  Commit: 0.08,
  Confirm: 0.12,
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * 12 deterministic weekly points. TTCC declines steadily as the tier settles in;
 * CCFR spikes in the first weeks, then declines below where it started.
 */
export function getTtccSeries(tier: TrustTier): TtccPoint[] {
  const base = TIER_BASELINE[tier]
  const points: TtccPoint[] = []

  for (let week = 1; week <= 12; week++) {
    const progress = (week - 1) / 11
    const improvement = 1 - progress * 0.35
    // Bell curve peaking around week 3, then a gentle overall decline.
    const spike = Math.exp(-(((week - 3) / 3) ** 2))
    const ccfr = base.ccfr * (0.7 + 0.6 * spike) * (1 - progress * 0.25)

    points.push({
      week: `W${week}`,
      ttccMedianHours: round1(base.median * improvement),
      ttccP90Hours: round1(base.p90 * improvement),
      ccfrPercent: round1(ccfr),
    })
  }

  return points
}

/**
 * Dwell time across the five phases of a commit, summing to the tier's median TTCC.
 */
export function getFiveCsDwell(tier: TrustTier): FiveCDwell[] {
  const total = TIER_BASELINE[tier].median
  return FIVE_C_PHASES.map((phase) => ({
    phase,
    hours: round1(total * PHASE_WEIGHTS[phase]),
  }))
}
