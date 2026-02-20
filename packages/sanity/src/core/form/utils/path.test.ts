import {describe, expect, test} from 'vitest'

import {decodePath, encodePath} from './path'

describe('encodePath', () => {
  test('encodes simple paths', () => {
    expect(encodePath(['a', 'b', 'c'])).toBe('a.b.c')
  })

  test('encodes paths with array indices', () => {
    expect(encodePath(['a', 'b', 5])).toBe('a.b[5]')
  })

  test('encodes paths with key segments', () => {
    expect(encodePath(['array', {_key: 'foo'}])).toBe('array[_key=="foo"]')
  })
})

describe('decodePath', () => {
  test('decodes simple paths', () => {
    expect(decodePath('a.b.c')).toEqual(['a', 'b', 'c'])
  })

  test('decodes paths with array indices', () => {
    expect(decodePath('a.b[5]')).toEqual(['a', 'b', 5])
  })

  test('decodes paths with key segments', () => {
    expect(decodePath('array[_key=="foo"]')).toEqual(['array', {_key: 'foo'}])
  })

  test('decodes paths with key segments containing periods', () => {
    expect(decodePath('array[_key=="object.key"]')).toEqual(['array', {_key: 'object.key'}])
  })

  test('decodes paths with key segments containing hyphens', () => {
    expect(decodePath('array[_key=="object-key"]')).toEqual(['array', {_key: 'object-key'}])
  })

  test('decodes complex paths with periods in keys', () => {
    expect(decodePath('items[_key=="v1.0.0"].name')).toEqual([
      'items',
      {_key: 'v1.0.0'},
      'name',
    ])
  })

  test('decodes paths with single-quoted keys containing periods', () => {
    expect(decodePath("array[_key=='object.key']")).toEqual(['array', {_key: 'object.key'}])
  })

  test('handles numeric indices at the start', () => {
    expect(decodePath('[0].foo.bar')).toEqual([0, 'foo', 'bar'])
  })

  test('handles multiple key segments', () => {
    expect(decodePath('a[_key=="b.c"][_type=="d.e"]')).toEqual([
      'a',
      {_key: 'b.c'},
      {_type: 'd.e'},
    ])
  })
})

describe('roundtrip', () => {
  const cases = [
    ['a', 'b', 'c'],
    ['a', 'b', 5],
    ['array', {_key: 'foo'}],
    ['array', {_key: 'object.key'}],
    ['items', {_key: 'v1.0.0'}, 'name'],
  ]

  cases.forEach((path, i) => {
    test(`roundtrip case #${i}`, () => {
      const encoded = encodePath(path as any)
      const decoded = decodePath(encoded)
      expect(decoded).toEqual(path)
    })
  })
})
