import {describe, expect, it} from 'vitest'

import {bootstrapDiffOfMedians, type DiffInterval} from '../bootstrap'
import {
  gate,
  INP_THRESHOLDS,
  INTERACTION_THRESHOLDS,
  PAGELOAD_THRESHOLDS,
  shouldStop,
} from '../gate'
import {median, quantile, summarize} from '../quantiles'
import {mulberry32, type Rng} from '../rng'

describe('quantile (type-7)', () => {
  it('interpolates linearly', () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5)
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3)
    expect(quantile([1, 2, 3, 4], 0.25)).toBe(1.75)
    expect(quantile([10], 0.9)).toBe(10)
  })

  it('computes the CI-bound quantiles (0.025/0.975) exactly on known arrays', () => {
    // Type-7: index = p * (n - 1), linear interpolation between ranks.
    // [1..5]: 0.025 * 4 = 0.1 → 1 + 0.1 * (2 - 1); 0.975 * 4 = 3.9 → 4 + 0.9
    expect(quantile([1, 2, 3, 4, 5], 0.025)).toBeCloseTo(1.1, 12)
    expect(quantile([1, 2, 3, 4, 5], 0.975)).toBeCloseTo(4.9, 12)
    // The bounds must be symmetric ranks from each end — an off-by-half-rank
    // (e.g. floor on one side, round on the other) breaks this equality
    const values = Array.from({length: 41}, (_, i) => i) // 0..40
    expect(quantile(values, 0.025)).toBeCloseTo(1, 12) // 0.025 * 40 = rank 1
    expect(quantile(values, 0.975)).toBeCloseTo(39, 12) // symmetric from the top
    expect(quantile(values, 0.025) + quantile(values, 0.975)).toBeCloseTo(40, 12)
    // Order of input must not matter
    expect(quantile([5, 3, 1, 4, 2], 0.975)).toBeCloseTo(4.9, 12)
  })

  it('is exact at p=0 and p=1 (min and max)', () => {
    expect(quantile([7, 3, 9, 1], 0)).toBe(1)
    expect(quantile([7, 3, 9, 1], 1)).toBe(9)
  })

  it('does not mutate its input', () => {
    const values = [3, 1, 2]
    median(values)
    expect(values).toEqual([3, 1, 2])
  })

  it('summarize reports all percentiles', () => {
    const stats = summarize([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(stats).toMatchObject({n: 10, median: 5.5, min: 1, max: 10})
  })

  it('throws on empty samples', () => {
    expect(() => quantile([], 0.5)).toThrow()
  })

  it('throws on non-finite samples instead of poisoning downstream gates', () => {
    // A NaN median would make every `>` in gate() false — a real regression
    // would silently gate `neutral`
    expect(() => quantile([1, NaN, 3], 0.5)).toThrow(/non-finite/)
    expect(() => quantile([Infinity], 0.5)).toThrow(/non-finite/)
    expect(() => median([2, -Infinity])).toThrow(/non-finite/)
  })

  it('throws on an out-of-range or non-finite p (a caller bug, not silent NaN)', () => {
    expect(() => quantile([1, 2, 3], -0.1)).toThrow(/in \[0, 1\]/)
    expect(() => quantile([1, 2, 3], 1.5)).toThrow(/in \[0, 1\]/)
    expect(() => quantile([1, 2, 3], NaN)).toThrow(/in \[0, 1\]/)
    expect(() => quantile([1, 2, 3], Infinity)).toThrow(/in \[0, 1\]/)
    // The boundaries are valid (min/max)
    expect(() => quantile([1, 2, 3], 0)).not.toThrow()
    expect(() => quantile([1, 2, 3], 1)).not.toThrow()
  })
})

describe('mulberry32', () => {
  it('is deterministic per seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('differs across seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })
})

/** Draw a session (array of latency samples) from a noisy distribution. */
function makeSession(rng: Rng, baseMs: number, samples = 32): number[] {
  return Array.from({length: samples}, () => {
    // log-normal-ish: base + noise + occasional spike
    const noise = (rng() + rng() + rng() - 1.5) * 4
    const spike = rng() < 0.05 ? rng() * 40 : 0
    return Math.max(8, baseMs + noise + spike)
  })
}

function makeSessions(rng: Rng, baseMs: number, count: number): number[][] {
  return Array.from({length: count}, () => makeSession(rng, baseMs))
}

describe('bootstrapDiffOfMedians', () => {
  it('is reproducible for the same rng seed', () => {
    const sessionsA = makeSessions(mulberry32(7), 32, 8)
    const sessionsB = makeSessions(mulberry32(8), 36, 8)
    const first = bootstrapDiffOfMedians({
      aSessions: sessionsA,
      bSessions: sessionsB,
      rng: mulberry32(99),
    })
    const second = bootstrapDiffOfMedians({
      aSessions: sessionsA,
      bSessions: sessionsB,
      rng: mulberry32(99),
    })
    expect(first).toEqual(second)
  })

  it('detects a real difference with a CI excluding zero', () => {
    const rng = mulberry32(3)
    const interval = bootstrapDiffOfMedians({
      aSessions: makeSessions(rng, 32, 10),
      bSessions: makeSessions(rng, 42, 10),
      rng: mulberry32(4),
    })
    expect(interval.diff).toBeGreaterThan(5)
    expect(interval.lo).toBeGreaterThan(0)
  })

  it('golden: fixed sessions + fixed seed produce these exact bounds', () => {
    // These values were produced by running the current implementation once
    // and hard-coding the output. They pin the exact resampling order and the
    // type-7 percentile index arithmetic: a regression that shifts a bound by
    // half a rank (the anti-conservative bug class the bootstrap comment
    // warns about) changes lo/hi and fails here, while every distribution-
    // level test would still pass.
    const interval = bootstrapDiffOfMedians({
      aSessions: [
        [30, 32, 31],
        [29, 33, 30],
        [31, 31, 32],
        [30, 34, 29],
      ],
      bSessions: [
        [36, 38, 35],
        [37, 39, 36],
        [35, 40, 37],
        [38, 36, 39],
      ],
      rng: mulberry32(1234),
      iterations: 500,
    })
    expect(interval).toEqual({diff: 6, lo: 5.5, hi: 7.5, level: 0.95, iterations: 500})
  })
})

const interval = (diff: number, lo: number, hi: number): DiffInterval => ({
  diff,
  lo,
  hi,
  level: 0.95,
  iterations: 2000,
})

describe('gate', () => {
  it('flags a regression only when the CI excludes zero AND the effect clears the floors', () => {
    expect(
      gate({diff: 8, lo: 5, hi: 11, level: 0.95, iterations: 2000}, 32, INTERACTION_THRESHOLDS),
    ).toBe('regression')
    // CI excludes zero but effect below the absolute floor
    expect(
      gate({diff: 1, lo: 0.5, hi: 1.5, level: 0.95, iterations: 2000}, 32, INTERACTION_THRESHOLDS),
    ).toBe('neutral')
  })

  it('flags improvements symmetrically', () => {
    expect(
      gate({diff: -8, lo: -11, hi: -5, level: 0.95, iterations: 2000}, 32, INTERACTION_THRESHOLDS),
    ).toBe('improvement')
  })

  it('reports inconclusive for wide intervals instead of a coin flip', () => {
    expect(
      gate({diff: 2, lo: -20, hi: 24, level: 0.95, iterations: 2000}, 32, INTERACTION_THRESHOLDS),
    ).toBe('inconclusive')
  })

  it('shouldStop once the CI is tight', () => {
    expect(
      shouldStop(
        {diff: 0, lo: -2, hi: 2, level: 0.95, iterations: 2000},
        32,
        INTERACTION_THRESHOLDS,
      ),
    ).toBe(true)
    expect(
      shouldStop(
        {diff: 0, lo: -10, hi: 10, level: 0.95, iterations: 2000},
        32,
        INTERACTION_THRESHOLDS,
      ),
    ).toBe(false)
  })

  it('a diff exactly at the minimum effect IS a verdict (inclusive >= boundary)', () => {
    // INTERACTION at referenceMedian 32: minimumEffect = max(3, 0.05·32) = 3
    expect(gate(interval(3, 0.5, 5.5), 32, INTERACTION_THRESHOLDS)).toBe('regression')
    expect(gate(interval(-3, -5.5, -0.5), 32, INTERACTION_THRESHOLDS)).toBe('improvement')
    // A hair under the floor is not a verdict — with a tight CI it's neutral
    expect(gate(interval(2.999, 0.5, 5.5), 32, INTERACTION_THRESHOLDS)).toBe('neutral')
    expect(gate(interval(-2.999, -5.5, -0.5), 32, INTERACTION_THRESHOLDS)).toBe('neutral')
  })

  it('an improvement below the effect floor is neutral, not an improvement', () => {
    // CI excludes zero, but the effect is too small to matter
    expect(gate(interval(-1, -1.8, -0.2), 32, INTERACTION_THRESHOLDS)).toBe('neutral')
  })

  it('uses the relative floor when it dominates the absolute one', () => {
    // referenceMedian 100: minimumEffect = max(3, 0.05·100) = 5, not absMs=3
    expect(gate(interval(4, 1, 7), 100, INTERACTION_THRESHOLDS)).toBe('neutral')
    expect(gate(interval(5, 1, 9), 100, INTERACTION_THRESHOLDS)).toBe('regression')
    // Same for improvements
    expect(gate(interval(-4, -7, -1), 100, INTERACTION_THRESHOLDS)).toBe('neutral')
    expect(gate(interval(-5, -9, -1), 100, INTERACTION_THRESHOLDS)).toBe('improvement')
  })

  it('a half-width exactly at the stop bound is decidable (neutral), just past it is not', () => {
    // Bound = max(targetHalfWidthMs, minimumEffect) = max(4, 3) = 4 at ref 32
    expect(gate(interval(0, -4, 4), 32, INTERACTION_THRESHOLDS)).toBe('neutral')
    expect(shouldStop(interval(0, -4, 4), 32, INTERACTION_THRESHOLDS)).toBe(true)
    expect(gate(interval(0, -4.1, 4.1), 32, INTERACTION_THRESHOLDS)).toBe('inconclusive')
    expect(shouldStop(interval(0, -4.1, 4.1), 32, INTERACTION_THRESHOLDS)).toBe(false)
  })

  it('property: shouldStop is the exact complement of gate() === inconclusive for zero-spanning intervals', () => {
    // gate() documents shouldStop as "the exact complement of gate's
    // inconclusive boundary" — a converged run must never gate inconclusive,
    // and a run that would gate inconclusive must keep sampling. For
    // intervals spanning zero neither verdict branch can fire, so the
    // equivalence must hold everywhere.
    const rng = mulberry32(77)
    for (const thresholds of [INTERACTION_THRESHOLDS, PAGELOAD_THRESHOLDS]) {
      for (const referenceMedian of [10, 32, 100, 1000, 4000]) {
        for (let i = 0; i < 200; i++) {
          const lo = -rng() * referenceMedian
          const hi = rng() * referenceMedian
          const diff = lo + rng() * (hi - lo)
          const candidate = interval(diff, lo, hi)
          expect(shouldStop(candidate, referenceMedian, thresholds)).toBe(
            gate(candidate, referenceMedian, thresholds) !== 'inconclusive',
          )
        }
      }
    }
  })
})

describe('INP_THRESHOLDS (report-only signal, never gates CI)', () => {
  it('reads a small delta within the loose floors as not a regression', () => {
    // referenceMedian 300: minimumEffect = max(150, 0.15·300) = 150. A 40ms
    // delta stays well inside that even with a fairly tight CI.
    expect(gate(interval(40, 10, 70), 300, INP_THRESHOLDS)).not.toBe('regression')
    expect(gate(interval(40, 10, 70), 300, INP_THRESHOLDS)).toBe('neutral')
  })

  it('flags a regression only once a large delta clears both floors with a CI excluding zero', () => {
    // Diff 200ms clears both the absolute (150) and relative (0.15·300 = 45)
    // floors, and the CI [120, 280] excludes zero.
    expect(gate(interval(200, 120, 280), 300, INP_THRESHOLDS)).toBe('regression')
  })

  it('is looser than PAGELOAD_THRESHOLDS, matching the report-only rationale', () => {
    expect(INP_THRESHOLDS.absMs).toBeGreaterThan(PAGELOAD_THRESHOLDS.absMs)
    expect(INP_THRESHOLDS.rel).toBeGreaterThan(PAGELOAD_THRESHOLDS.rel)
    expect(INP_THRESHOLDS.targetHalfWidthMs).toBeGreaterThan(PAGELOAD_THRESHOLDS.targetHalfWidthMs)
  })
})

describe('self-test property (same distribution on both sides)', () => {
  it(
    'two draws from the same distribution gate neutral/inconclusive (never a verdict) in ≥95% of seeds',
    {timeout: 60_000},
    () => {
      let falseVerdicts = 0
      const seeds = 100
      for (let seed = 0; seed < seeds; seed++) {
        const rng = mulberry32(1000 + seed)
        const interval = bootstrapDiffOfMedians({
          aSessions: makeSessions(rng, 32, 8),
          bSessions: makeSessions(rng, 32, 8),
          rng: mulberry32(2000 + seed),
          iterations: 1000,
        })
        const verdict = gate(interval, 32, INTERACTION_THRESHOLDS)
        if (verdict === 'regression' || verdict === 'improvement') {
          falseVerdicts += 1
        }
      }
      expect(falseVerdicts).toBeLessThanOrEqual(seeds * 0.05)
    },
  )
})
