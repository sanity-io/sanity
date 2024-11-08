import {describe, expect, it} from 'vitest'

import {getCursorPredicate, getNextCursor} from './getNextCursor'

describe('getNextCursor', () => {
  it('returns `undefined` if there is no `lastResult`', () => {
    expect(
      getNextCursor({
        sortOrder: [
          {
            direction: 'asc',
            field: 'a',
          },
        ],
      }),
    ).toBeUndefined()
  })

  it('produces the correct cursor for a single sort order', () => {
    expect(
      getNextCursor({
        lastResult: {
          _type: 'value:_type',
          _id: 'value:_id',
          a: 'value:a',
        },
        sortOrder: [
          {
            direction: 'asc',
            field: 'a',
          },
        ],
      }),
    ).toBe('(a > "value:a") || (a == "value:a" && _id > "value:_id")')
  })

  it('produces the correct cursor for multiple sort orders', () => {
    expect(
      getNextCursor({
        lastResult: {
          _type: 'value:_type',
          _id: 'value:_id',
          a: 'value:a',
          b: 'value:b',
          c: 'value:c',
        },
        sortOrder: [
          {
            direction: 'asc',
            field: 'a',
          },
          {
            direction: 'asc',
            field: 'b',
          },
          {
            direction: 'desc',
            field: 'c',
          },
        ],
      }),
    ).toBe(
      '(a > "value:a") || (a == "value:a" && b > "value:b") || (a == "value:a" && b == "value:b" && c < "value:c") || (a == "value:a" && b == "value:b" && c == "value:c" && _id > "value:_id")',
    )
  })

  it('uses `_id` as a tiebreaker', () => {
    expect(
      getNextCursor({
        lastResult: {
          _type: 'value:_type',
          _id: 'value:_id',
          a: 'value:a',
        },
        sortOrder: [
          {
            direction: 'asc',
            field: 'a',
          },
        ],
      }),
    ).toBe('(a > "value:a") || (a == "value:a" && _id > "value:_id")')
  })
})

it('does not uses `_id` as a tiebreaker if it appears in the user-provided sort orders', () => {
  expect(
    getNextCursor({
      lastResult: {
        _type: 'value:_type',
        _id: 'value:_id',
        a: 'value:a',
      },
      sortOrder: [
        {
          direction: 'desc',
          field: '_id',
        },
      ],
    }),
  ).toBe('(_id < "value:_id")')

  expect(
    getNextCursor({
      lastResult: {
        _type: 'value:_type',
        _id: 'value:_id',
        a: 'value:a',
        b: 'value:b',
      },
      sortOrder: [
        {
          direction: 'asc',
          field: '_id',
        },
        {
          direction: 'desc',
          field: 'a',
        },
        {
          direction: 'asc',
          field: 'b',
        },
      ],
    }),
  ).toBe('(_id > "value:_id") || (a < "value:a") || (a == "value:a" && b > "value:b")')
})

describe('getCursorPredicate', () => {
  it('uses the `>` comparator when sort is `asc`', () => {
    expect(
      getCursorPredicate(
        {
          direction: 'asc',
          field: 'a',
        },
        {
          _type: 'value:_type',
          _id: 'value:_id',
          a: 'value:a',
        },
      ),
    ).toBe(`a > "value:a"`)
  })

  it('uses the `<` comparator when sort is `desc`', () => {
    expect(
      getCursorPredicate(
        {
          direction: 'desc',
          field: 'a',
        },
        {
          _type: 'value:_type',
          _id: 'value:_id',
          a: 'value:a',
        },
      ),
    ).toBe(`a < "value:a"`)
  })

  it('allows the comparator to be overridden', () => {
    expect(
      getCursorPredicate(
        {
          direction: 'asc',
          field: 'a',
        },
        {
          _type: 'value:_type',
          _id: 'value:_id',
          a: 'value:a',
        },
        '==',
      ),
    ).toBe(`a == "value:a"`)
  })

  it('returns `undefined` when comparing equality of unique field', () => {
    expect(
      getCursorPredicate(
        {
          direction: 'asc',
          field: '_id',
        },
        {
          _type: 'value:_type',
          _id: 'value:_id',
        },
        '==',
      ),
    ).toBeUndefined()
  })
})
