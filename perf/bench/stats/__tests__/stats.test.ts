import {describe, expect, it} from 'vitest'

import {bootstrapDiffOfMedians} from '../bootstrap'
import {gate, INTERACTION_THRESHOLDS, shouldStop} from '../gate'
import {median, quantile, summarize} from '../quantiles'
import {mulberry32, type Rng} from '../rng'

describe('quantile (type-7)', () => {
  it('interpolates linearly', () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5)
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3)
    expect(quantile([1, 2, 3, 4], 0.25)).toBe(1.75)
    expect(quantile([10], 0.9)).toBe(10)
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
