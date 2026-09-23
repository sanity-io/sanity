import {expect, test} from 'vitest'

import {extract} from '../src/jsonpath'

test('basic extraction', () => {
  expect(extract('nums[3,5]', {nums: [0, 1, 2, 3, 4, 5]})).toEqual([3, 5])
  expect(extract('[nums, nums[1]]', {nums: [42, 13]})).toEqual([13, [42, 13]])
  expect(extract('..[_ref?]', {parent: {_ref: '123'}})).toEqual([{_ref: '123'}])
  expect(extract('[@ > 7]', [10, null, 2])).toEqual([10])
  expect(extract('..kazoo', {kazoo: 'fneh', zip: null})).toEqual(['fneh'])
})

test('resolves negative-index and open-ended-range descends against the value', () => {
  // These path shapes previously threw ("must have a probe") because the lead
  // count was resolved without the value in scope.
  expect(extract('a[-1].b', {a: [{b: 1}, {b: 2}]})).toEqual([2])
  expect(extract('a[0:].b', {a: [{b: 1}]})).toEqual([1])
  // Out of range descends resolve to nothing rather than throwing.
  expect(extract('a[5].b', {a: [{b: 1}]})).toEqual([])
  // Index descends into a non-array resolve to nothing, even the shapes
  // that need the value's length to resolve.
  expect(extract('a[-1].b', {a: 'string'})).toEqual([])
  expect(extract('a[0:].b', {a: 'string'})).toEqual([])
})
