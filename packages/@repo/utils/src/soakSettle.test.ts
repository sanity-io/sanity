import {describe, expect, test} from 'vitest'

import {DEFAULT_SOAK_SETTLE_MINUTE, soakSettleMinute, steadySoakSamples} from './soakSettle'

describe('soakSettleMinute', () => {
  test('defaults to minute 2 on a full-length soak', () => {
    expect(soakSettleMinute(10)).toBe(DEFAULT_SOAK_SETTLE_MINUTE)
  })

  test('honours a requested settle minute', () => {
    expect(soakSettleMinute(10, 4)).toBe(4)
  })

  test('leaves the final minute for a slope on short soaks', () => {
    expect(soakSettleMinute(2)).toBe(1)
    expect(soakSettleMinute(1)).toBe(0)
    expect(soakSettleMinute(5, 9)).toBe(4)
  })

  test('never goes below minute 0', () => {
    expect(soakSettleMinute(0)).toBe(0)
    expect(soakSettleMinute(10, -3)).toBe(0)
  })
})

describe('steadySoakSamples', () => {
  test('keeps the settle minute and everything after it', () => {
    const samples = [0, 1, 2, 3].map((minute) => ({minute, heapMb: minute * 10}))
    expect(steadySoakSamples(samples, 2).map((sample) => sample.minute)).toEqual([2, 3])
  })
})
