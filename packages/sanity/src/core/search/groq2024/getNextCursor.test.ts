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

  it('uses the compiled expression as the GROQ predicate target when supplied', () => {
    expect(
      getCursorPredicate(
        {
          direction: 'asc',
          field: 'author.name',
          projectionIndex: 0,
        },
        {
          _type: 'value:_type',
          _id: 'value:_id',
          orderings: ['value:authorName'],
        },
        undefined,
        {expression: 'author->name', projectionIndex: 0},
      ),
    ).toBe('author->name > "value:authorName"')
  })

  it('reads the cursor value from `orderings` when projectionIndex is set', () => {
    expect(
      getCursorPredicate(
        {
          direction: 'desc',
          field: 'translations.se',
          projectionIndex: 2,
        },
        {
          _type: 'value:_type',
          _id: 'value:_id',
          orderings: [null, null, 'value:translation'],
        },
        undefined,
        {expression: 'translations.se', projectionIndex: 2},
      ),
    ).toBe('translations.se < "value:translation"')
  })
})

describe('getNextCursor with compiled entries', () => {
  it('uses compiled expressions for the GROQ side and `orderings` for the value side', () => {
    expect(
      getNextCursor({
        lastResult: {
          _type: 'value:_type',
          _id: 'value:_id',
          orderings: ['value:authorName'],
        },
        sortOrder: [
          {
            direction: 'asc',
            field: 'author.name',
            projectionIndex: 0,
          },
        ],
        compiledSortEntries: [{expression: 'author->name', projectionIndex: 0}],
      }),
    ).toBe(
      '(author->name > "value:authorName") || (author->name == "value:authorName" && _id > "value:_id")',
    )
  })

  it('handles multiple projected entries with `_id` tiebreaker appended', () => {
    expect(
      getNextCursor({
        lastResult: {
          _type: 'value:_type',
          _id: 'value:_id',
          orderings: ['value:title', 'value:authorName'],
        },
        sortOrder: [
          {
            direction: 'asc',
            field: 'title',
            projectionIndex: 0,
          },
          {
            direction: 'desc',
            field: 'author.name',
            projectionIndex: 1,
          },
        ],
        compiledSortEntries: [
          {expression: 'title', projectionIndex: 0},
          {expression: 'author->name', projectionIndex: 1},
        ],
      }),
    ).toBe(
      '(title > "value:title") || (title == "value:title" && author->name < "value:authorName") || (title == "value:title" && author->name == "value:authorName" && _id > "value:_id")',
    )
  })
})
