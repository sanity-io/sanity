import {test} from 'tap'
import {extract} from '../src/jsonpath'

test('basic extraction', tap => {
  tap.same(extract('nums[3,5]', {nums: [0, 1, 2, 3, 4, 5]}), [3, 5])
  tap.same(extract('[nums, nums[1]]', {nums: [42, 13]}), [13, [42, 13]])
  tap.end()
})
