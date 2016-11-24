import {test} from 'tap'
import {extract} from '../src/jsonpath'

test('basic extraction', tap => {
  tap.same(extract('nums[3,5]', {nums: [0, 1, 2, 3, 4, 5]}), [3, 5])
  tap.same(extract('[nums, nums[1]]', {nums: [42, 13]}), [13, [42, 13]])
  tap.same(extract('..[_ref?]', {parent: {_ref: '123'}}), [{_ref: '123'}])
  tap.same(extract('[@ > 7]', [10, null, 2]), [10], 'Array with null value')
  tap.same(extract('..kazoo', {kazoo: 'fneh', zip: null}), ['fneh'], 'Object with null value')
  tap.end()
})
