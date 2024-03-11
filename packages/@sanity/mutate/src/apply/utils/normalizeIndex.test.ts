import {expect, test} from 'vitest'

import {normalizeIndex} from './array'

test('normalizeIndex()', () => {
  // zero length array
  expect(normalizeIndex(0, -1)).toBe(0)
  expect(normalizeIndex(0, 0)).toBe(0)
  expect(normalizeIndex(0, 1)).toBe(null)
  expect(normalizeIndex(0, 2)).toBe(null)
  expect(normalizeIndex(0, -2)).toBe(null)

  // single item array
  expect(normalizeIndex(1, -1)).toBe(0)
  expect(normalizeIndex(1, 1)).toBe(null)
  expect(normalizeIndex(1, 0)).toBe(0)
  expect(normalizeIndex(1, 2)).toBe(null)
  expect(normalizeIndex(1, -2)).toBe(null)

  // several items array
  expect(normalizeIndex(2, 0)).toBe(0)
  expect(normalizeIndex(2, 1)).toBe(1)
  expect(normalizeIndex(2, 2)).toBe(null)
  expect(normalizeIndex(2, -1)).toBe(1)
  expect(normalizeIndex(2, -2)).toBe(0)
  expect(normalizeIndex(2, -3)).toBe(null)
})
