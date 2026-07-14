import {describe, expect, it} from 'vitest'

import {computeInp, INP_MIN_INTERACTIONS} from '../inp'

describe('computeInp', () => {
  it('returns zero and not-reportable for no interactions', () => {
    expect(computeInp([], 0)).toEqual({inpMs: 0, interactionCount: 0, reportable: false})
  })

  it('returns zero when every driven interaction stayed below the floor', () => {
    // 60 driven, none observable — nothing to pick a percentile from
    expect(computeInp([], 60)).toEqual({inpMs: 0, interactionCount: 60, reportable: false})
  })

  it('uses the worst interaction below the reportable threshold', () => {
    const result = computeInp([10, 50, 30, 20], 4)
    expect(result.inpMs).toBe(50)
    expect(result.interactionCount).toBe(4)
    expect(result.reportable).toBe(false)
  })

  it('is reportable at exactly the threshold', () => {
    const values = Array.from({length: INP_MIN_INTERACTIONS}, (_, i) => i + 1)
    const result = computeInp(values, INP_MIN_INTERACTIONS)
    expect(result.reportable).toBe(true)
    expect(result.interactionCount).toBe(INP_MIN_INTERACTIONS)
    // floor(50/50) = 1 → the 2nd-worst interaction (index 1 in descending)
    expect(result.inpMs).toBe(INP_MIN_INTERACTIONS - 1)
  })

  it('steps one interaction deeper per 50, matching web-vitals', () => {
    // 100 interactions: floor(100/50) = 2 → the 3rd-worst (index 2 descending)
    const values = Array.from({length: 100}, (_, i) => i + 1) // 1..100
    // descending: 100, 99, 98, … → index 2 is 98
    expect(computeInp(values, 100).inpMs).toBe(98)
  })

  it('does not let a single outlier define the score on a long session', () => {
    const steady = Array.from({length: 60}, () => 40)
    const withSpike = [500, ...steady]
    // 61 interactions: floor(61/50) = 1 → the 2nd-worst, which is the steady 40,
    // so the lone 500ms spike is excluded
    expect(computeInp(withSpike, 61).inpMs).toBe(40)
  })

  it('indexes by the driven total, not the observed count', () => {
    // 60 driven but only 3 observed (the rest below the observability floor):
    // the index is floor(60/50) = 1 (2nd-worst observed), not floor(3/50) = 0
    expect(computeInp([500, 40, 30], 60).inpMs).toBe(40)
  })

  it('clamps the index to the observed list', () => {
    // 150 driven, 2 observed: floor(150/50) = 2 would run off the end
    expect(computeInp([80, 40], 150).inpMs).toBe(40)
  })

  it('marks reportable from the driven total even when few entries are observed', () => {
    const result = computeInp([80, 40], 60)
    expect(result.reportable).toBe(true)
    expect(result.interactionCount).toBe(60)
  })

  it('does not decrease when a below-floor interaction becomes observable', () => {
    // A regression pushes one previously-unobservable interaction over the
    // floor: 49 observed → 50, driven total unchanged at 60. Under
    // observed-count indexing the index would jump from floor(49/50) = 0
    // (the 300ms worst) to floor(50/50) = 1 (a 40ms entry) — INP dropping
    // from 300 to 40 because the studio got *slower*.
    const steady = Array.from({length: 48}, () => 40)
    const before = computeInp([300, ...steady], 60)
    const after = computeInp([300, ...steady, 40], 60)
    expect(before.inpMs).toBe(40) // floor(60/50) = 1 → 2nd-worst
    expect(after.inpMs).toBe(40)
    expect(after.inpMs).toBeGreaterThanOrEqual(before.inpMs)
  })

  it('rejects more observed entries than driven interactions', () => {
    expect(() => computeInp([10, 20], 1)).toThrow(/observed latencies exceed/)
  })

  it('does not mutate its input', () => {
    const values = [30, 10, 20]
    computeInp(values, 3)
    expect(values).toEqual([30, 10, 20])
  })
})
