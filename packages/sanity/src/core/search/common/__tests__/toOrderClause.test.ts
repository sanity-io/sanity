import {describe, expect, it} from 'vitest'

import {toOrderClause} from '../toOrderClause'

describe('toOrderClause', () => {
  it('should generate basic order clause', () => {
    expect(toOrderClause([{field: 'title', direction: 'asc'}])).toBe('title asc')
  })

  it('should handle mapWith', () => {
    expect(toOrderClause([{field: 'title', direction: 'asc', mapWith: 'lower'}])).toBe(
      'lower(title) asc',
    )
  })

  it('should handle multiple sort fields', () => {
    expect(
      toOrderClause([
        {field: 'title', direction: 'desc'},
        {field: '_createdAt', direction: 'asc'},
      ]),
    ).toBe('title desc,_createdAt asc')
  })

  it('should handle empty array', () => {
    expect(toOrderClause([])).toBe('')
  })

  describe('nulls sorting', () => {
    it('should not add prefix for desc + nulls first (default behavior)', () => {
      expect(toOrderClause([{field: 'title', direction: 'desc', nulls: 'first'}])).toBe(
        'title desc',
      )
    })

    it('should not add prefix for asc + nulls last (default behavior)', () => {
      expect(toOrderClause([{field: 'title', direction: 'asc', nulls: 'last'}])).toBe('title asc')
    })

    it('should add prefix for desc + nulls last (override)', () => {
      expect(toOrderClause([{field: 'title', direction: 'desc', nulls: 'last'}])).toBe(
        'select(defined(title) => 0, 1),title desc',
      )
    })

    it('should add prefix for asc + nulls first (override)', () => {
      expect(toOrderClause([{field: 'title', direction: 'asc', nulls: 'first'}])).toBe(
        'select(defined(title) => 1, 0),title asc',
      )
    })

    it('should use raw field name in defined() even with mapWith', () => {
      expect(
        toOrderClause([{field: 'title', direction: 'desc', nulls: 'last', mapWith: 'lower'}]),
      ).toBe('select(defined(title) => 0, 1),lower(title) desc')
    })

    it('should handle mixed nulls config across multiple sort fields', () => {
      expect(
        toOrderClause([
          {field: 'priority', direction: 'desc', nulls: 'last'},
          {field: 'title', direction: 'asc'},
        ]),
      ).toBe('select(defined(priority) => 0, 1),priority desc,title asc')
    })

    it('should handle nulls override on multiple fields', () => {
      expect(
        toOrderClause([
          {field: 'priority', direction: 'desc', nulls: 'last'},
          {field: 'title', direction: 'asc', nulls: 'first'},
        ]),
      ).toBe(
        'select(defined(priority) => 0, 1),priority desc,select(defined(title) => 1, 0),title asc',
      )
    })
  })

  describe('projectionIndex addressing (orderings)', () => {
    it('addresses an entry via orderings[projectionIndex]', () => {
      expect(
        toOrderClause([{field: 'translations.se', direction: 'asc', projectionIndex: 0}]),
      ).toBe('orderings[0] asc')
    })

    it('respects projectionIndex=0 (does not fall back to bare field)', () => {
      // `projectionIndex` is a numeric index; 0 must be treated as a
      // real value, not falsy.
      expect(toOrderClause([{field: 'author.name', direction: 'desc', projectionIndex: 0}])).toBe(
        'orderings[0] desc',
      )
    })

    it('wraps mapWith around the projected target', () => {
      expect(
        toOrderClause([
          {field: 'translations.se', direction: 'asc', projectionIndex: 1, mapWith: 'lower'},
        ]),
      ).toBe('lower(orderings[1]) asc')
    })

    it('uses the projected target for defined() in null-sort overrides', () => {
      expect(
        toOrderClause([
          {field: 'translations.se', direction: 'desc', projectionIndex: 2, nulls: 'last'},
        ]),
      ).toBe('select(defined(orderings[2]) => 0, 1),orderings[2] desc')
    })

    it('handles a mix of projected and bare entries in one clause', () => {
      expect(
        toOrderClause([
          {field: 'translations.se', direction: 'asc', projectionIndex: 0, mapWith: 'lower'},
          {field: '_updatedAt', direction: 'desc'},
        ]),
      ).toBe('lower(orderings[0]) asc,_updatedAt desc')
    })
  })
})
