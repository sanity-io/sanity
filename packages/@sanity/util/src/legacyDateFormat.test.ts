/* eslint-disable max-nested-callbacks */
import {TZDateMini} from '@date-fns/tz'
import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest'

import {format, parse} from './legacyDateFormat'

describe('legacyDateFormat', () => {
  beforeAll(() => {
    // Mock timezone to ensure consistent test results
    // This simulates the browser being in Europe/Oslo (UTC+2 in summer)
    vi.stubEnv('TZ', 'Europe/Oslo')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  describe('parse', () => {
    describe('with timezone and dateFormat (user input)', () => {
      test('should interpret components as being in the target timezone', () => {
        // User types "2024-11-17 10:30" in a field configured for America/New_York
        const result = parse('2024-11-17 10:30', 'YYYY-MM-DD HH:mm', 'America/New_York')

        expect(result.isValid).toBe(true)
        expect(result.date).toBeInstanceOf(TZDateMini)

        // The resulting date should represent 10:30 AM in New York
        // Not 10:30 AM in Oslo converted to New York
        const date = result.date!
        expect(date.getFullYear()).toBe(2024)
        expect(date.getMonth()).toBe(10) // November (0-indexed)
        expect(date.getDate()).toBe(17)
        expect(date.getHours()).toBe(10)
        expect(date.getMinutes()).toBe(30)
      })

      test('should handle different timezones correctly', () => {
        // Same input, different timezones should produce different UTC times
        const nyResult = parse('2024-01-15 12:00', 'YYYY-MM-DD HH:mm', 'America/New_York')
        const tokyoResult = parse('2024-01-15 12:00', 'YYYY-MM-DD HH:mm', 'Asia/Tokyo')

        expect(nyResult.isValid).toBe(true)
        expect(tokyoResult.isValid).toBe(true)

        // Both should represent 12:00 in their respective timezones
        expect(nyResult.date!.getHours()).toBe(12)
        expect(tokyoResult.date!.getHours()).toBe(12)

        // But their underlying UTC times should be different
        expect(nyResult.date!.getTime()).not.toBe(tokyoResult.date!.getTime())
      })

      test('should handle all time components (including milliseconds)', () => {
        const result = parse('2024-11-17 14:30:45.123', 'YYYY-MM-DD HH:mm:ss.SSS', 'Europe/London')

        expect(result.isValid).toBe(true)
        const date = result.date!
        expect(date.getHours()).toBe(14)
        expect(date.getMinutes()).toBe(30)
        expect(date.getSeconds()).toBe(45)
        expect(date.getMilliseconds()).toBe(123)
      })
    })

    describe('with timezone but no dateFormat (ISO strings)', () => {
      test('should wrap the date for display without conversion', () => {
        // ISO string already contains absolute time information
        const isoString = '2024-11-17T15:30:00.000Z'
        const result = parse(isoString, undefined, 'America/New_York')

        expect(result.isValid).toBe(true)
        expect(result.date).toBeInstanceOf(TZDateMini)

        // Should preserve the exact moment in time
        const date = result.date!
        expect(date.toISOString()).toBe(isoString)
      })

      test('should handle ISO strings with timezone offset', () => {
        const isoString = '2024-11-17T15:30:00+05:00'
        const result = parse(isoString, undefined, 'Europe/Paris')

        expect(result.isValid).toBe(true)
        expect(result.date).toBeInstanceOf(TZDateMini)
      })
    })

    describe('without timezone', () => {
      test('should return a regular Date when no timezone is specified', () => {
        const result = parse('2024-11-17 10:30', 'YYYY-MM-DD HH:mm')

        expect(result.isValid).toBe(true)
        expect(result.date).toBeInstanceOf(Date)
        expect(result.date).not.toBeInstanceOf(TZDateMini)
      })

      test('should parse ISO strings without timezone', () => {
        const result = parse('2024-11-17T10:30:00.000Z')

        expect(result.isValid).toBe(true)
        expect(result.date).toBeInstanceOf(Date)
      })
    })

    describe('invalid inputs', () => {
      test('should return isValid: false for invalid date strings', () => {
        const result = parse('not-a-date', 'YYYY-MM-DD')

        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
      })

      test('should return isValid: false for date string that does not match format', () => {
        const result = parse('2024/11/17', 'YYYY-MM-DD')

        expect(result.isValid).toBe(false)
      })
    })

    describe('edge cases', () => {
      test('should handle invalid timezone gracefully', () => {
        const result = parse('2024-11-17 10:30', 'YYYY-MM-DD HH:mm', 'Invalid/Timezone')

        expect(result.isValid).toBe(true)
        // Should fall back to regular Date (no timezone conversion)
        expect(result.date).toBeInstanceOf(Date)
      })

      test('should handle date-only formats', () => {
        const result = parse('2024-11-17', 'YYYY-MM-DD', 'America/Los_Angeles')

        expect(result.isValid).toBe(true)
        const date = result.date!
        expect(date.getFullYear()).toBe(2024)
        expect(date.getMonth()).toBe(10) // November
        expect(date.getDate()).toBe(17)
        expect(date.getHours()).toBe(0)
        expect(date.getMinutes()).toBe(0)
        expect(date.getSeconds()).toBe(0)
      })
    })
  })

  describe('format', () => {
    test('should format date with UTC when useUTC is true', () => {
      const date = new Date('2024-11-17T15:30:00.000Z')
      const result = format(date, 'YYYY-MM-DD HH:mm', {useUTC: true})

      expect(result).toBe('2024-11-17 15:30')
    })

    test('should format date with timezone when specified', () => {
      const date = new Date('2024-11-17T15:30:00.000Z')
      const result = format(date, 'YYYY-MM-DD HH:mm', {timeZone: 'America/New_York'})

      // 15:30 UTC is 10:30 in New York (EST, UTC-5)
      expect(result).toBe('2024-11-17 10:30')
    })

    test('should format date in local timezone by default', () => {
      const date = new Date('2024-11-17T15:30:00.000Z')
      const result = format(date, 'YYYY-MM-DD HH:mm')

      // In our mocked Oslo timezone (UTC+1 in winter)
      expect(result).toBe('2024-11-17 16:30')
    })
  })

  describe('round-trip: parse and format', () => {
    test('should maintain consistency when parsing and formatting with same timezone', () => {
      const original = '2024-11-17 14:30'
      const dateFormat = 'YYYY-MM-DD HH:mm'
      const timeZone = 'America/Chicago'

      const parsed = parse(original, dateFormat, timeZone)
      expect(parsed.isValid).toBe(true)

      const formatted = format(parsed.date!, dateFormat, {timeZone})
      expect(formatted).toBe(original)
    })
  })
})
