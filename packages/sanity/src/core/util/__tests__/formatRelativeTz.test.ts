import {describe, expect, it} from 'vitest'

import {formatRelativeTz} from '../formatRelativeTz'

describe('formatRelativeTz', () => {
  const mockFormatDateTz = ({date}: {date: Date}) => date.toISOString().split('T')[0]

  it('returns relative terms for dates within a week', () => {
    const baseDate = new Date('2024-01-10T12:00:00Z')
    const tomorrow = new Date('2024-01-11T12:00:00Z')

    const result = formatRelativeTz({
      date: tomorrow,
      baseDate,
      formatDateTz: mockFormatDateTz,
    })

    // date-fns returns relative terms like "tomorrow at..."
    expect(result).toContain('tomorrow')
  })

  it('returns formatted date for dates beyond a week', () => {
    const baseDate = new Date('2024-01-10T12:00:00Z')
    const farDate = new Date('2024-02-15T12:00:00Z')

    const result = formatRelativeTz({
      date: farDate,
      baseDate,
      formatDateTz: mockFormatDateTz,
    })

    // Should use the formatDateTz function
    expect(result).toBe('2024-02-15')
  })

  it('appends timezone abbreviation when different from local', () => {
    const baseDate = new Date('2024-01-10T12:00:00Z')
    const farDate = new Date('2024-02-15T12:00:00Z')

    const result = formatRelativeTz({
      date: farDate,
      baseDate,
      formatDateTz: mockFormatDateTz,
      includeTimeZone: true,
      timeZoneAbbreviation: 'PST',
      localTimeZoneAbbreviation: 'EST',
    })

    expect(result).toBe('2024-02-15 (PST)')
  })

  it('does not append timezone abbreviation when same as local', () => {
    const baseDate = new Date('2024-01-10T12:00:00Z')
    const farDate = new Date('2024-02-15T12:00:00Z')

    const result = formatRelativeTz({
      date: farDate,
      baseDate,
      formatDateTz: mockFormatDateTz,
      includeTimeZone: true,
      timeZoneAbbreviation: 'EST',
      localTimeZoneAbbreviation: 'EST',
    })

    expect(result).toBe('2024-02-15')
  })

  it('omits timezone abbreviation when includeTimeZone is false', () => {
    const baseDate = new Date('2024-01-10T12:00:00Z')
    const farDate = new Date('2024-02-15T12:00:00Z')

    const result = formatRelativeTz({
      date: farDate,
      baseDate,
      formatDateTz: mockFormatDateTz,
      includeTimeZone: false,
      timeZoneAbbreviation: 'PST',
      localTimeZoneAbbreviation: 'EST',
    })

    expect(result).toBe('2024-02-15')
  })

  it('uses current date as baseDate when not provided', () => {
    const farFutureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const result = formatRelativeTz({
      date: farFutureDate,
      formatDateTz: mockFormatDateTz,
    })

    // Should use formatDateTz for far future dates
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}/)
  })
})
