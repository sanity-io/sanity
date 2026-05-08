import {tz} from '@date-fns/tz'
import {formatRelative} from 'date-fns/formatRelative'
import {describe, expect, it} from 'vitest'

import {formatRelativeLocale} from '../formatRelativeLocale'

const currentDate = new Date('2023-10-01')

describe('formatRelativeLocale', () => {
  it('should return relative format for dates within a week', () => {
    const dateWithinWeek = new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days later

    const result = formatRelativeLocale(dateWithinWeek, currentDate, 'UTC')
    // Should match formatRelative when both interpret the dates in UTC
    expect(result).toBe(formatRelative(dateWithinWeek, currentDate, {in: tz('UTC')}))
  })

  it('should return a locale date string for dates more than a week away', () => {
    const dateMoreThanAWeek = new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000) // 10 days later

    const result = formatRelativeLocale(dateMoreThanAWeek, currentDate, 'UTC')
    // expect locale string in UTC zone
    expect(result).toBe(dateMoreThanAWeek.toLocaleDateString(undefined, {timeZone: 'UTC'}))
  })

  it('should return locale date string for past dates more than a week ago', () => {
    const dateMoreThanAWeekAgo = new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago

    const result = formatRelativeLocale(dateMoreThanAWeekAgo, currentDate, 'UTC')
    expect(result).toBe(dateMoreThanAWeekAgo.toLocaleDateString(undefined, {timeZone: 'UTC'}))
  })

  it('renders the time portion in the provided timeZone', () => {
    // Same UTC instants, different wall-clock time per zone:
    //   target = 2023-10-02T01:00:00Z  -> 10:00 in Asia/Tokyo, 21:00 in America/New_York
    //   base   = 2023-10-01T22:00:00Z  -> 07:00 (Oct 2) in Tokyo, 18:00 (Oct 1) in New_York
    // In each zone, target and base fall on the same calendar day, so both render as "today at <time>".
    const baseDate = new Date('2023-10-01T22:00:00Z')
    const target = new Date('2023-10-02T01:00:00Z')

    const tokyo = formatRelativeLocale(target, baseDate, 'Asia/Tokyo')
    const newYork = formatRelativeLocale(target, baseDate, 'America/New_York')

    expect(tokyo).toMatch(/today at/i)
    expect(newYork).toMatch(/today at/i)
    expect(tokyo).not.toEqual(newYork)
    expect(tokyo).toContain('10:00')
    expect(newYork).toContain('9:00 PM')
  })

  it('crosses the relative-day boundary based on the provided timeZone', () => {
    // 2023-10-01T15:00:00Z is:
    //   - Oct 1 23:00 in Asia/Singapore (+08:00)  -> "today" relative to Oct 1 16:00 SGT (08:00:00Z)
    //   - Oct 2 04:00 in Pacific/Auckland (+13:00) -> "tomorrow" relative to Oct 1 21:00 NZDT (08:00:00Z)
    const baseDate = new Date('2023-10-01T08:00:00Z') // Oct 1 in both zones
    const target = new Date('2023-10-01T15:00:00Z')

    const singapore = formatRelativeLocale(target, baseDate, 'Asia/Singapore')
    const auckland = formatRelativeLocale(target, baseDate, 'Pacific/Auckland')

    expect(singapore).toMatch(/today at/i)
    expect(auckland).toMatch(/tomorrow at/i)
  })
})
