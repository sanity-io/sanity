import {describe, expect, it} from 'vitest'

import {deepEqualsIgnoreKey} from '../src/util/deepEqualsIgnoreKey'

describe('deepEqualsIgnoreKey', () => {
  it.each([
    [{value: 'popular'}, {_key: 'generated', value: 'popular'}],
    [
      {_key: 'first', value: 'popular'},
      {_key: 'second', value: 'popular'},
    ],
    [{nested: [{value: 'popular'}]}, {nested: [{_key: 'generated', value: 'popular'}]}],
    [{}, {_key: 'generated'}],
  ])('ignores missing or different keys in either direction: %j, %j', (a, b) => {
    expect(deepEqualsIgnoreKey(a, b)).toBe(true)
    expect(deepEqualsIgnoreKey(b, a)).toBe(true)
  })

  it.each([
    [{value: 'popular'}, {_key: 'generated', value: 'other'}],
    [{value: 'popular'}, {_key: 'generated', value: 'popular', label: 'Extra'}],
    [
      {_key: 'generated', value: 'popular'},
      {value: 'popular', label: 'Extra'},
    ],
    [{nested: [{value: 'popular'}]}, {nested: [{_key: 'generated', value: 'other'}]}],
    [[{value: 'popular'}], [{_key: 'generated', value: 'popular'}, {value: 'extra'}]],
  ])('still compares every other property in either direction: %j, %j', (a, b) => {
    expect(deepEqualsIgnoreKey(a, b)).toBe(false)
    expect(deepEqualsIgnoreKey(b, a)).toBe(false)
  })
})
