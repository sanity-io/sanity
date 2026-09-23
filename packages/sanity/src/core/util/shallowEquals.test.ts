import {describe, expect, it} from 'vitest'

import {shallowEquals} from './shallowEquals'

describe('shallowEquals', () => {
  it('compares primitives with strict equality', () => {
    expect(shallowEquals(1, 1)).toBe(true)
    expect(shallowEquals('a', 'a')).toBe(true)
    expect(shallowEquals<unknown>(1, '1')).toBe(false)
    expect(shallowEquals(null, null)).toBe(true)
    expect(shallowEquals(undefined, undefined)).toBe(true)
    expect(shallowEquals(null, undefined)).toBe(false)
    // matches the retired shallow-equals package: NaN is not equal to itself
    expect(shallowEquals(NaN, NaN)).toBe(false)
  })

  it('compares flat objects one level deep', () => {
    expect(shallowEquals({granted: true, reason: 'ok'}, {granted: true, reason: 'ok'})).toBe(true)
    expect(shallowEquals({granted: true, reason: 'ok'}, {granted: false, reason: 'ok'})).toBe(false)
  })

  it('detects missing and extra keys on either side', () => {
    expect(shallowEquals({a: 1, b: 2}, {a: 1})).toBe(false)
    expect(shallowEquals({a: 1}, {a: 1, b: 2})).toBe(false)
  })

  it('treats an undefined-valued key and a missing key as different', () => {
    expect(shallowEquals({a: 1, b: undefined}, {a: 1})).toBe(false)
    expect(shallowEquals({a: 1}, {a: 1, b: undefined})).toBe(false)
    expect(shallowEquals({a: 1, b: undefined}, {a: 1, b: undefined})).toBe(true)
  })

  it('compares nested values by reference only', () => {
    const nested = {x: 1}
    expect(shallowEquals({a: nested}, {a: nested})).toBe(true)
    expect(shallowEquals({a: {x: 1}}, {a: {x: 1}})).toBe(false)
  })

  it('compares arrays by length and element reference', () => {
    const item = {_key: 'a'}
    expect(shallowEquals([item, 'b'], [item, 'b'])).toBe(true)
    expect(shallowEquals([item], [{_key: 'a'}])).toBe(false)
    expect(shallowEquals([1, 2], [1, 2, 3])).toBe(false)
  })

  it('never treats an array and an object as equal', () => {
    expect(shallowEquals<unknown>([], {})).toBe(false)
    expect(shallowEquals<unknown>({}, [])).toBe(false)
    expect(shallowEquals({}, {})).toBe(true)
    expect(shallowEquals([], [])).toBe(true)
  })
})
