import {describe, expect, it} from 'vitest'

import {formatDuration, formatMeasuredDuration} from './formatDuration'

describe('formatDuration', () => {
  it('keeps milliseconds under 1000ms', () => {
    expect(formatDuration(0)).toBe('0ms')
    expect(formatDuration(1)).toBe('1ms')
    expect(formatDuration(888)).toBe('888ms')
    expect(formatDuration(999)).toBe('999ms')
    expect(formatDuration(888.4)).toBe('888ms')
  })

  it('uses seconds from 1000ms, with the same precision as a scaled byte size', () => {
    expect(formatDuration(999.6)).toBe('1.00s')
    expect(formatDuration(1_000)).toBe('1.00s')
    expect(formatDuration(1_170)).toBe('1.17s')
    expect(formatDuration(1_500)).toBe('1.50s')
    expect(formatDuration(10_500)).toBe('10.5s')
    expect(formatDuration(59_940)).toBe('59.9s')
  })

  it('uses a larger unit once seconds, minutes or hours would be awkward', () => {
    expect(formatDuration(59_950)).toBe('1.00m')
    expect(formatDuration(60_000)).toBe('1.00m')
    expect(formatDuration(90_000)).toBe('1.50m')
    expect(formatDuration(3_540_000)).toBe('59.0m')
    expect(formatDuration(3_600_000)).toBe('1.00h')
    expect(formatDuration(5_400_000)).toBe('1.50h')
    expect(formatDuration(86_400_000)).toBe('1.00d')
    expect(formatDuration(900_000_000)).toBe('10.4d')
    expect(formatDuration(100 * 86_400_000)).toBe('100d')
  })

  it('treats a missing or negative duration as zero', () => {
    expect(formatDuration(Number.NaN)).toBe('0ms')
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0ms')
    expect(formatDuration(-1)).toBe('0ms')
  })
})

describe('formatMeasuredDuration', () => {
  it('writes microseconds under a millisecond', () => {
    expect(formatMeasuredDuration(0)).toBe('0µs')
    expect(formatMeasuredDuration(0.1)).toBe('100µs')
    expect(formatMeasuredDuration(0.4)).toBe('400µs')
    expect(formatMeasuredDuration(0.0004)).toBe('0µs')
  })

  it('keeps three significant digits up to 100ms', () => {
    expect(formatMeasuredDuration(0.9996)).toBe('1.00ms')
    expect(formatMeasuredDuration(1.84)).toBe('1.84ms')
    expect(formatMeasuredDuration(9.996)).toBe('10.0ms')
    expect(formatMeasuredDuration(12.43)).toBe('12.4ms')
    expect(formatMeasuredDuration(90)).toBe('90.0ms')
  })

  it('is formatDuration from 100ms', () => {
    expect(formatMeasuredDuration(99.96)).toBe('100ms')
    expect(formatMeasuredDuration(888.4)).toBe('888ms')
    expect(formatMeasuredDuration(1_170)).toBe('1.17s')
    expect(formatMeasuredDuration(90_000)).toBe('1.50m')
  })

  it('treats a missing or negative duration as zero', () => {
    expect(formatMeasuredDuration(Number.NaN)).toBe('0µs')
    expect(formatMeasuredDuration(-1)).toBe('0µs')
  })
})
