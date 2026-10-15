import {describe, expect, it} from 'vitest'

import {omitFields, parseFieldPaths} from './omitFields'

const paths = parseFieldPaths(['_rev', '_updatedAt', '_system.base.rev', ' ', 'a..b'])

describe('parseFieldPaths', () => {
  it('splits paths into segments and drops empty ones', () => {
    expect(paths).toEqual([['_rev'], ['_updatedAt'], ['_system', 'base', 'rev'], ['a', 'b']])
  })
})

describe('omitFields', () => {
  it('drops the fields at any depth, through arrays', () => {
    const result = [
      {
        _id: 'a',
        _rev: 'r1',
        _updatedAt: 't1',
        _system: {base: {id: 'a', rev: 'r0'}},
        author: {_ref: 'b', _rev: 'nested'},
        items: [{_rev: 'item', title: 'x'}],
      },
    ]
    expect(omitFields(result, paths)).toEqual([
      {
        _id: 'a',
        _system: {base: {id: 'a'}},
        author: {_ref: 'b'},
        items: [{title: 'x'}],
      },
    ])
  })

  it('follows nested paths from any object, not only the top', () => {
    expect(omitFields({doc: {_system: {base: {rev: 'r', id: 'x'}}}}, paths)).toEqual({
      doc: {_system: {base: {id: 'x'}}},
    })
    // A path whose start does not match is not taken from the middle
    expect(omitFields({base: {rev: 'kept'}}, paths)).toEqual({base: {rev: 'kept'}})
  })

  it('returns parts without hidden fields as they are', () => {
    const value = {title: 'x', tags: ['a'], nested: {count: 1}}
    expect(omitFields(value, paths)).toBe(value)
    expect(omitFields(value, [])).toBe(value)
    expect(omitFields('text', paths)).toBe('text')
    const partly = {keep: {a: 1}, drop: {_rev: 'r'}}
    expect((omitFields(partly, paths) as typeof partly).keep).toBe(partly.keep)
  })

  it('keeps a __proto__ key a key', () => {
    const value: Record<string, unknown> = JSON.parse('{"__proto__": {"x": 1}, "_rev": "r"}')
    const omitted = omitFields(value, paths) as Record<string, unknown>
    expect(Object.keys(omitted)).toEqual(['__proto__'])
    expect(Object.getPrototypeOf(omitted)).toBe(Object.prototype)
  })
})
