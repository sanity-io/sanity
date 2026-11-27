import {describe, expect, test} from 'vitest'

import {delta, percentile, summarize} from './stats'

describe('stats', () => {
  test('median and p75 interpolate between neighbouring samples', () => {
    expect(percentile([4, 1, 3, 2], 50)).toBe(2.5)
    expect(percentile([1, 2, 3, 4, 5], 75)).toBe(4)
    expect(percentile([10, 20], 75)).toBe(17.5)
  })

  test('summarize keeps the samples in run order', () => {
    expect(summarize([3, 1, 2])).toEqual({max: 3, median: 2, min: 1, p75: 2.5, samples: [3, 1, 2]})
  })

  test('delta is v7 relative to v6', () => {
    expect(delta(200, 150)).toEqual({absolute: -50, percent: -25})
    expect(delta(0, 5)).toEqual({absolute: 5, percent: null})
  })
})
