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
})
