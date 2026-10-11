import {expect, test} from 'vitest'

import {relativeDate} from './dates'

const NOW = Date.parse('2026-08-20T12:00:00Z')

test('buckets elapsed time into the largest sensible unit', () => {
  expect(relativeDate('2026-08-20T11:59:30Z', NOW)).toBe('just now')
  expect(relativeDate('2026-08-20T11:45:00Z', NOW)).toBe('15 minutes ago')
  expect(relativeDate('2026-08-20T07:00:00Z', NOW)).toBe('5 hours ago')
  expect(relativeDate('2026-08-19T12:00:00Z', NOW)).toBe('yesterday')
  expect(relativeDate('2026-08-13T12:00:00Z', NOW)).toBe('7 days ago')
  expect(relativeDate('2026-06-20T12:00:00Z', NOW)).toBe('2 months ago')
  expect(relativeDate('2024-08-20T12:00:00Z', NOW)).toBe('2 years ago')
})

test('falls back to the raw string for unparseable input', () => {
  expect(relativeDate('not-a-date', NOW)).toBe('not-a-date')
})

test('a future timestamp (clock skew) reads as "just now", not a negative age', () => {
  expect(relativeDate('2026-08-20T12:30:00Z', NOW)).toBe('just now')
})
