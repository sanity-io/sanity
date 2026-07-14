import {describe, expect, it} from 'vitest'

import {computeInp, INP_MIN_INTERACTIONS} from '../inp'

describe('computeInp', () => {
  it('returns zero and not-reportable for no interactions', () => {
    expect(computeInp([])).toEqual({inpMs: 0, interactionCount: 0, reportable: false})
  })

  it('uses the worst interaction below the reportable threshold', () => {
    const result = computeInp([10, 50, 30, 20])
    expect(result.inpMs).toBe(50)
    expect(result.interactionCount).toBe(4)
    expect(result.reportable).toBe(false)
  })

  it('is reportable at exactly the threshold', () => {
    const values = Array.from({length: INP_MIN_INTERACTIONS}, (_, i) => i + 1)
    const result = computeInp(values)
    expect(result.reportable).toBe(true)
    expect(result.interactionCount).toBe(INP_MIN_INTERACTIONS)
    // floor(50/50) = 1 → the 2nd-worst interaction (index 1 in descending)
    expect(result.inpMs).toBe(INP_MIN_INTERACTIONS - 1)
  })

  it('steps one interaction deeper per 50, matching web-vitals', () => {
    // 100 interactions: floor(100/50) = 2 → the 3rd-worst (index 2 descending)
    const values = Array.from({length: 100}, (_, i) => i + 1) // 1..100
    // descending: 100, 99, 98, … → index 2 is 98
    expect(computeInp(values).inpMs).toBe(98)
  })

  it('does not let a single outlier define the score on a long session', () => {
    const steady = Array.from({length: 60}, () => 40)
    const withSpike = [500, ...steady]
    // 61 interactions: floor(61/50) = 1 → the 2nd-worst, which is the steady 40,
    // so the lone 500ms spike is excluded
    expect(computeInp(withSpike).inpMs).toBe(40)
  })

  it('does not mutate its input', () => {
    const values = [30, 10, 20]
    computeInp(values)
    expect(values).toEqual([30, 10, 20])
  })
})
