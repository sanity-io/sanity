import {median, quantile} from './quantiles'
import {type Rng} from './rng'

export interface DiffInterval {
  /** Point estimate: median(B pooled) − median(A pooled). */
  diff: number
  /** Percentile bootstrap confidence bounds on the difference. */
  lo: number
  hi: number
  level: number
  iterations: number
}

/**
 * Cluster bootstrap on the difference of medians. Sessions — not pooled
 * keystrokes — are the resampling unit: keystrokes within a session share
 * environment state (GC phase, scheduler mood, neighbor noise), so
 * resampling them individually would fake independence and produce
 * overconfident intervals.
 *
 * Each iteration resamples sessions with replacement per side, pools the
 * resampled sessions' samples, and takes `median(B) − median(A)`; the
 * interval is the percentile range of those differences.
 */
export function bootstrapDiffOfMedians(options: {
  /** Per-session sample arrays for side A (reference). */
  aSessions: number[][]
  /** Per-session sample arrays for side B (experiment). */
  bSessions: number[][]
  rng: Rng
  iterations?: number
  level?: number
}): DiffInterval {
  const {aSessions, bSessions, rng, iterations = 2000, level = 0.95} = options
  if (aSessions.length === 0 || bSessions.length === 0) {
    throw new Error('bootstrapDiffOfMedians requires at least one session per side')
  }

  const resampledDiff = () => {
    const a = resampleSessions(aSessions, rng)
    const b = resampleSessions(bSessions, rng)
    return median(b) - median(a)
  }

  const diffs: number[] = []
  for (let i = 0; i < iterations; i++) {
    diffs.push(resampledDiff())
  }

  // Symmetric percentile bounds via the shared type-7 quantile — index
  // arithmetic here previously made the lower bound half a rank
  // anti-conservative relative to the upper
  const alpha = (1 - level) / 2
  return {
    diff: median(bSessions.flat()) - median(aSessions.flat()),
    lo: quantile(diffs, alpha),
    hi: quantile(diffs, 1 - alpha),
    level,
    iterations,
  }
}

function resampleSessions(sessions: number[][], rng: Rng): number[] {
  const pooled: number[] = []
  for (let i = 0; i < sessions.length; i++) {
    const pick = sessions[Math.floor(rng() * sessions.length)]
    for (const sample of pick) {
      pooled.push(sample)
    }
  }
  return pooled
}
