import {expect, test} from 'vitest'

import {startsWith} from '../predicates'

test('startsWith()', () => {
  expect(startsWith(['foo'], ['foo', 'bar'])).toBe(true)
  expect(startsWith(['foo', 'bar'], ['foo', 'bar'])).toBe(true)
  expect(startsWith(['foo', 'bar', 'baz'], ['foo', 'bar'])).toBe(false)
  expect(startsWith([0, 1], [0, 1, {_key: 'test'}])).toBe(true)
})
