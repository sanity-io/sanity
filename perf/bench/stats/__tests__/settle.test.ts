import {describe, expect, it} from 'vitest'

import {computeSettle, DEFAULT_SETTLE_WINDOW, settleMismatch} from '../settle'

const READY = 10_000
const CONFIG = {quietWindowMs: 3_000, maxSettleMs: 30_000, activityFloor: 0}

describe('computeSettle', () => {
  it('settles with settleTimeMs 0 when the page is born quiet', () => {
    const result = computeSettle({
      activityTimestamps: [],
      readinessAt: READY,
      nowMs: READY + 3_000,
      config: CONFIG,
    })
    expect(result).toEqual({settled: true, settleTimeMs: 0, timedOut: false})
  })

  it('cannot settle before one full quiet window has elapsed', () => {
    const result = computeSettle({
      activityTimestamps: [],
      readinessAt: READY,
      nowMs: READY + 2_999,
      config: CONFIG,
    })
    expect(result.settled).toBe(false)
    expect(result.timedOut).toBe(false)
  })

  it('does not settle while activity falls inside the trailing window', () => {
    const result = computeSettle({
      activityTimestamps: [READY + 1_000, READY + 4_000],
      readinessAt: READY,
      nowMs: READY + 5_000,
      config: CONFIG,
    })
    expect(result.settled).toBe(false)
  })

  it('settles once the window clears, timing from the last activity', () => {
    const result = computeSettle({
      activityTimestamps: [READY + 1_000, READY + 4_000],
      readinessAt: READY,
      nowMs: READY + 7_100,
      config: CONFIG,
    })
    expect(result).toEqual({settled: true, settleTimeMs: 4_000, timedOut: false})
  })

  it('times out under sustained activity (the render-loop shape)', () => {
    // Activity every 500ms forever — the loop never leaves the window quiet.
    const loop = Array.from({length: 61}, (_, index) => READY + index * 500)
    const result = computeSettle({
      activityTimestamps: loop,
      readinessAt: READY,
      nowMs: READY + 30_000,
      config: CONFIG,
    })
    expect(result).toEqual({settled: false, settleTimeMs: null, timedOut: true})
  })

  it('is not timed out before the cap while still unsettled', () => {
    const result = computeSettle({
      activityTimestamps: [READY + 28_000],
      readinessAt: READY,
      nowMs: READY + 29_000,
      config: CONFIG,
    })
    expect(result).toEqual({settled: false, settleTimeMs: null, timedOut: false})
  })

  it('activityFloor tolerates stragglers and excludes them from settle time', () => {
    const result = computeSettle({
      activityTimestamps: [READY + 2_000, READY + 9_500],
      readinessAt: READY,
      nowMs: READY + 10_000,
      config: {...CONFIG, activityFloor: 1},
    })
    // The straggler at +9500 is inside the window but tolerated; settle time
    // comes from the last activity before the window (+2000).
    expect(result).toEqual({settled: true, settleTimeMs: 2_000, timedOut: false})
  })

  it('ignores boot noise at or before readiness', () => {
    const result = computeSettle({
      activityTimestamps: [READY - 500, READY],
      readinessAt: READY,
      nowMs: READY + 3_000,
      config: CONFIG,
    })
    expect(result).toEqual({settled: true, settleTimeMs: 0, timedOut: false})
  })

  it('applies the documented defaults when config is omitted', () => {
    expect(DEFAULT_SETTLE_WINDOW).toEqual({
      quietWindowMs: 3_000,
      maxSettleMs: 30_000,
      activityFloor: 0,
    })
    const result = computeSettle({
      activityTimestamps: [],
      readinessAt: READY,
      nowMs: READY + DEFAULT_SETTLE_WINDOW.quietWindowMs,
    })
    expect(result.settled).toBe(true)
  })
})

describe('settleMismatch', () => {
  it('flags an expected-green scenario with any non-settling session', () => {
    expect(settleMismatch({expectedToSettle: true, settledCount: 4, sessionCount: 5})).toBe(true)
    expect(settleMismatch({expectedToSettle: true, settledCount: 5, sessionCount: 5})).toBe(false)
  })

  it('flags an expected-red scenario only on unanimous settling (stale flag)', () => {
    expect(settleMismatch({expectedToSettle: false, settledCount: 5, sessionCount: 5})).toBe(true)
    expect(settleMismatch({expectedToSettle: false, settledCount: 4, sessionCount: 5})).toBe(false)
    expect(settleMismatch({expectedToSettle: false, settledCount: 0, sessionCount: 5})).toBe(false)
  })

  it('never flags an empty session set', () => {
    expect(settleMismatch({expectedToSettle: true, settledCount: 0, sessionCount: 0})).toBe(false)
    expect(settleMismatch({expectedToSettle: false, settledCount: 0, sessionCount: 0})).toBe(false)
  })
})
