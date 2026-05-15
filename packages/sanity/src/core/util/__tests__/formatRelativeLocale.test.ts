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
    // Both zones never observe DST, so the offsets stay constant year-round.
    const baseDate = new Date('2023-10-01T22:00:00Z')
    const target = new Date('2023-10-02T01:00:00Z')

    const tokyo = formatRelativeLocale(target, baseDate, 'Asia/Tokyo')
    const honolulu = formatRelativeLocale(target, baseDate, 'Pacific/Honolulu')

    expect(tokyo).toMatch(/today at/i)
    expect(honolulu).toMatch(/today at/i)
    expect(tokyo).not.toEqual(honolulu)
    expect(tokyo).toContain('10:00') // 01:00 UTC = 10:00 in Tokyo (+09)
    expect(honolulu).toContain('3:00 PM') // 01:00 UTC = 15:00 in Honolulu (-10)
  })

  it('crosses the relative-day boundary based on the provided timeZone', () => {
    // Both zones never observe DST, so the offsets stay constant year-round.
    const baseDate = new Date('2023-10-01T08:00:00Z')
    const target = new Date('2023-10-01T15:00:00Z')

    const singapore = formatRelativeLocale(target, baseDate, 'Asia/Singapore')
    const brisbane = formatRelativeLocale(target, baseDate, 'Australia/Brisbane')

    expect(singapore).toMatch(/today at/i) // Oct 1 23:00 in Singapore (+08), same day as base
    expect(brisbane).toMatch(/tomorrow at/i) // Oct 2 01:00 in Brisbane (+10), next day from base
  })
})
