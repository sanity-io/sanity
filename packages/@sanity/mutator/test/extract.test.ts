import {extract} from '../src/jsonpath'

test('basic extraction', () => {
  expect(extract('nums[3,5]', {nums: [0, 1, 2, 3, 4, 5]})).toEqual([3, 5])
  expect(extract('[nums, nums[1]]', {nums: [42, 13]})).toEqual([13, [42, 13]])
  expect(extract('..[_ref?]', {parent: {_ref: '123'}})).toEqual([{_ref: '123'}])
  expect(extract('[@ > 7]', [10, null, 2])).toEqual([10])
  expect(extract('..kazoo', {kazoo: 'fneh', zip: null})).toEqual(['fneh'])
})
