import {expect, it} from 'vitest'

import {isDeepEmpty} from '../isDeepEmpty'

it('returns true for undefined', () => {
  expect(isDeepEmpty(undefined)).toBe(true)
})

it('returns true for null', () => {
  expect(isDeepEmpty(null)).toBe(true)
})

it('returns true for an empty object', () => {
  expect(isDeepEmpty({})).toBe(true)
})

it('returns true for an object with only empty values', () => {
  expect(isDeepEmpty({a: {}, b: {c: {}}})).toBe(true)
})

it('returns false for an object with non-empty values', () => {
  expect(isDeepEmpty({a: {}, b: {c: {}}, d: 1})).toBe(false)
})

it('returns true for an empty array', () => {
  expect(isDeepEmpty([])).toBe(true)
})

it('returns true for an array with only empty values', () => {
  expect(isDeepEmpty([[], [[]]])).toBe(true)
})

it('returns false for an array with non-empty values', () => {
  expect(isDeepEmpty([[], [[]], 1])).toBe(false)
})

it('returns false for a non-empty object', () => {
  expect(isDeepEmpty({a: 1})).toBe(false)
})

it('returns false for a non-empty array', () => {
  expect(isDeepEmpty([1])).toBe(false)
})

it('ignores _type and _key properties', () => {
  expect(isDeepEmpty({_type: 'foo', _key: 'bar', a: {}})).toBe(true)
})
