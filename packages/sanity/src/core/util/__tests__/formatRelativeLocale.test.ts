import {formatRelative} from 'date-fns/formatRelative'
import {describe, expect, it} from 'vitest'

import {formatRelativeLocale} from '../formatRelativeLocale'

const currentDate = new Date('2023-10-01')

describe('formatRelativeLocale', () => {
  it('should return relative format for dates within a week', () => {
    const dateWithinWeek = new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days later

    const result = formatRelativeLocale(dateWithinWeek, currentDate)
    expect(result).toBe(formatRelative(dateWithinWeek, currentDate)) // Should match formatRelative directly
  })

  it('should return a locale date string for dates more than a week away', () => {
    const dateMoreThanAWeek = new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000) // 10 days later

    const result = formatRelativeLocale(dateMoreThanAWeek, currentDate)
    // expect locale string (MM/dd/yyyy format)
    expect(result).toBe(dateMoreThanAWeek.toLocaleDateString())
  })

  it('should return locale date string for past dates more than a week ago', () => {
    const dateMoreThanAWeekAgo = new Date(currentDate.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago

    const result = formatRelativeLocale(dateMoreThanAWeekAgo, currentDate)
    // Expected to be in locale format
    expect(result).toBe(dateMoreThanAWeekAgo.toLocaleDateString())
  })
})
