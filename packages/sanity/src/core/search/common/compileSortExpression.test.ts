import {describe, expect, test as baseTest, vi} from 'vitest'

import {bookType as book, withArraysType as withArrays} from './__fixtures__/mockSortSchema'
import {resetCompileFieldPathWarningCache} from './compileFieldPath'
import {compileSortExpression as compileSortExpressionImpl} from './compileSortExpression'
import {type SearchSort} from './types'

const test = baseTest.extend<{compileSortExpression: typeof compileSortExpressionImpl}>({
  // eslint-disable-next-line no-empty-pattern
  compileSortExpression: async ({}, consume) => {
    resetCompileFieldPathWarningCache()
    await consume(compileSortExpressionImpl)
    vi.restoreAllMocks()
  },
})

describe('compileSortExpression', () => {
  test('projects a simple top-level field at the entry index', ({compileSortExpression}) => {
    const sort: SearchSort = {field: 'title', direction: 'asc', schemaType: book}
    expect(compileSortExpression(sort, 0)).toEqual({
      expression: 'title',
      projectionIndex: 0,
    })
  })

  test('projects a built-in document field at the entry index', ({compileSortExpression}) => {
    const sort: SearchSort = {field: '_updatedAt', direction: 'desc', schemaType: book}
    expect(compileSortExpression(sort, 4)).toEqual({
      expression: '_updatedAt',
      projectionIndex: 4,
    })
  })

  test('projects nested object access at the entry index', ({compileSortExpression}) => {
    const sort: SearchSort = {
      field: 'translations.se',
      direction: 'asc',
      schemaType: book,
    }
    expect(compileSortExpression(sort, 0)).toEqual({
      expression: 'translations.se',
      projectionIndex: 0,
    })
  })

  test('uses the index passed in as the projectionIndex', ({compileSortExpression}) => {
    const sort: SearchSort = {
      field: 'translations.se',
      direction: 'asc',
      schemaType: book,
    }
    expect(compileSortExpression(sort, 3)).toEqual({
      expression: 'translations.se',
      projectionIndex: 3,
    })
  })

  test('compiles a reference traversal and projects it', ({compileSortExpression}) => {
    const sort: SearchSort = {field: 'author.name', direction: 'asc', schemaType: book}
    expect(compileSortExpression(sort, 0)).toEqual({
      expression: 'author->name',
      projectionIndex: 0,
    })
  })

  test('compiles array index + reference traversal and projects it', ({compileSortExpression}) => {
    const sort: SearchSort = {
      field: 'items[0].value',
      direction: 'asc',
      schemaType: withArrays,
    }
    expect(compileSortExpression(sort, 1)).toEqual({
      expression: 'items[0]->value',
      projectionIndex: 1,
    })
  })

  test('compiles keyed array access + reference traversal and projects it', ({
    compileSortExpression,
  }) => {
    const sort: SearchSort = {
      field: 'items[_key=="abc"].value',
      direction: 'asc',
      schemaType: withArrays,
    }
    expect(compileSortExpression(sort, 0)).toEqual({
      expression: 'items[_key=="abc"]->value',
      projectionIndex: 0,
    })
  })

  test('ignores any incoming `projectionIndex` on the SearchSort and uses the supplied index', ({
    compileSortExpression,
  }) => {
    // `SearchSort.projectionIndex` is the search strategy's output,
    // not a caller-facing input. If a stale or hand-crafted value
    // finds its way onto the input, the index passed to
    // `compileSortExpression` always wins — otherwise we'd risk
    // sparse `orderings` arrays.
    const sort: SearchSort = {
      field: 'translations.se',
      direction: 'asc',
      schemaType: book,
      projectionIndex: 42,
    }
    expect(compileSortExpression(sort, 0)).toEqual({
      expression: 'translations.se',
      projectionIndex: 0,
    })
  })

  test('falls back to literal expression when schemaType is missing', ({compileSortExpression}) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const sort: SearchSort = {field: 'translations.se', direction: 'asc'}
    expect(compileSortExpression(sort, 2)).toEqual({
      expression: 'translations.se',
      projectionIndex: 2,
    })
    // No warning — without a schema, we treat the path as literal
    // GROQ rather than reporting an unknown field.
    expect(warn).not.toHaveBeenCalled()
  })

  test('projects simple fields too when schemaType is missing', ({compileSortExpression}) => {
    const sort: SearchSort = {field: '_id', direction: 'asc'}
    expect(compileSortExpression(sort, 0)).toEqual({
      expression: '_id',
      projectionIndex: 0,
    })
  })

  test('handles an empty `field` by passing it through unchanged', ({compileSortExpression}) => {
    const sort: SearchSort = {field: '', direction: 'asc'}
    expect(compileSortExpression(sort, 0)).toEqual({
      expression: '',
      projectionIndex: 0,
    })
  })

  test('forwards strict mode and orderingName options to the field-path compiler', ({
    compileSortExpression,
  }) => {
    const sort: SearchSort = {
      field: 'nonExistentField',
      direction: 'asc',
      schemaType: book,
    }
    expect(() =>
      compileSortExpression(sort, 0, {strict: true, orderingName: 'By something'}),
    ).toThrow(
      'The sort ordering "By something" references the nonexistent field "nonExistentField"',
    )
  })
})
