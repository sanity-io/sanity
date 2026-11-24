import {describe, expect, it} from 'vitest'

import {
  isObjectParam,
  objectFields,
  previewObject,
  setObjectKey,
  typeFromValue,
} from './objectParams'
import {inferQueryParams} from './paramInference'

const [range] = inferQueryParams('*[count(tags) >= $range.min && count(tags) <= $range.max]').params

describe('objectParams', () => {
  it('edits a param as an object when the query reads its keys', () => {
    expect(isObjectParam(range, undefined, false)).toBe(true)
    expect(isObjectParam(range, {min: 1}, true)).toBe(true)
    // A value of another kind keeps the plain input, so it can still be sent for testing
    expect(isObjectParam(range, 'text', true)).toBe(false)
    expect(isObjectParam(range, [1], true)).toBe(false)
    // An untyped param keeps its JSON input, also while it holds an object
    const [extra] = inferQueryParams('*{"x": $extra}').params
    expect(isObjectParam(extra, undefined, false)).toBe(false)
    expect(isObjectParam(extra, {a: 1}, true)).toBe(false)
  })

  it('lists the keys the query reads first, then the ones the value has, typed by value', () => {
    expect(
      objectFields(range, {max: 10, label: 'x', at: '2026-01-01T00:00:00Z', tags: ['a']}).map(
        ({name, type}) => [name, type],
      ),
    ).toEqual([
      ['min', {kind: 'integer', array: false, min: 0}],
      ['max', {kind: 'integer', array: false, min: 0}],
      ['label', {kind: 'string', array: false}],
      ['at', {kind: 'string', array: false, format: 'datetime'}],
      ['tags', {kind: 'string', array: true}],
    ])
  })

  it('previews the keys that are set on one line', () => {
    const value = {min: 0, max: 10000, nested: {a: 1}}
    expect(previewObject(objectFields(range, value), value)).toBe(
      'min: 0, max: 10000, nested: {a: 1}',
    )
    expect(previewObject(objectFields(range, undefined), undefined)).toBe('')
  })

  it('caps deeply nested object previews instead of overflowing the call stack', () => {
    let deep: Record<string, unknown> = {leaf: 1}
    for (let index = 0; index < 3000; index++) {
      deep = {a: deep}
    }
    const fields = objectFields(range, {a: deep})
    expect(() => previewObject(fields, {a: deep})).not.toThrow()
    expect(previewObject(fields, {a: deep})).toContain('{…}')
  })

  it('sets and removes keys', () => {
    expect(setObjectKey(undefined, 'min', 1)).toEqual({min: 1})
    expect(setObjectKey({min: 1, max: 2}, 'min', undefined)).toEqual({max: 2})
  })

  it('types values that are not a single kind as any JSON', () => {
    expect(typeFromValue([1, 'a'])).toEqual({kind: 'any', array: false})
    expect(typeFromValue(null)).toEqual({kind: 'any', array: false})
  })
})
