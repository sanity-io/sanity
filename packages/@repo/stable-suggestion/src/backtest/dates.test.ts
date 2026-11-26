import {describe, expect, test} from 'vitest'

import {BACKTEST_FROM} from '../config'
import {backtestDates} from './dates'

describe('backtestDates', () => {
  const dates = backtestDates(BACKTEST_FROM, '2026-11-17')

  test('starts on the first Tuesday at 18:00 UTC', () => {
    expect(dates[0]).toBe('2025-12-09T18:00:00Z')
  })

  test('includes the last Tuesday', () => {
    expect(dates.at(-1)).toBe('2026-11-17T18:00:00Z')
    expect(dates).toContain('2026-11-17T18:00:00Z')
  })

  test('has one date per week', () => {
    expect(dates).toHaveLength(50)
    expect(dates.every((date) => new Date(date).getUTCDay() === 2)).toBe(true)
  })

  test('stops at the last Tuesday before a mid-week end', () => {
    expect(backtestDates('2025-12-09', '2025-12-18').at(-1)).toBe('2025-12-16T18:00:00Z')
  })

  test('excludes a Tuesday whose 18:00 is after a timestamp end', () => {
    expect(backtestDates('2025-12-09', '2025-12-16T17:59:59Z').at(-1)).toBe('2025-12-09T18:00:00Z')
  })

  test('moves a mid-week start to the next Tuesday', () => {
    expect(backtestDates('2025-12-10', '2025-12-31')).toEqual([
      '2025-12-16T18:00:00Z',
      '2025-12-23T18:00:00Z',
      '2025-12-30T18:00:00Z',
    ])
  })

  test('returns nothing when the range holds no Tuesday', () => {
    expect(backtestDates('2025-12-10', '2025-12-12')).toEqual([])
  })
})
