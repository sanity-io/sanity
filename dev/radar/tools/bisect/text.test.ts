import {expect, test} from 'vitest'

import {pluralize} from './text'

test('pluralizes counts', () => {
  expect(pluralize(1, 'commit')).toBe('1 commit')
  expect(pluralize(4, 'commit')).toBe('4 commits')
  expect(pluralize(0, 'mark')).toBe('0 marks')
  expect(pluralize(2, 'branch', 'branches')).toBe('2 branches')
})
