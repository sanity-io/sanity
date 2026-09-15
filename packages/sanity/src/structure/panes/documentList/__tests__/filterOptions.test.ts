import {describe, expect, test} from 'vitest'

import {combineDocumentListFilters} from '../filterOptions'

describe('combineDocumentListFilters', () => {
  test('returns the base filter and params when no menu filters are selected', () => {
    const params = {type: 'post'}

    expect(
      combineDocumentListFilters({
        filter: '_type == $type',
        params,
        selectedFilters: [],
      }),
    ).toEqual({filter: '_type == $type', params})
  })

  test('combines selected filters and their params with the base list constraint', () => {
    expect(
      combineDocumentListFilters({
        filter: '_type == $type',
        params: {type: 'post'},
        selectedFilters: [
          {
            id: 'featured',
            title: 'Featured',
            filter: 'featured == true',
          },
          {
            id: 'category',
            title: 'Category',
            filter: 'category._ref == $categoryId',
            params: {categoryId: 'category-1'},
          },
        ],
      }),
    ).toEqual({
      filter: '(_type == $type) && (featured == true) && (category._ref == $categoryId)',
      params: {type: 'post', categoryId: 'category-1'},
    })
  })

  test('does not allow filter options to override base list params', () => {
    expect(
      combineDocumentListFilters({
        filter: '_type == $type',
        params: {type: 'post'},
        selectedFilters: [
          {
            id: 'unsafe-type',
            title: 'Unsafe type',
            filter: 'status == $status',
            params: {type: 'author', status: 'published'},
          },
        ],
      }),
    ).toEqual({
      filter: '(_type == $type) && (status == $status)',
      params: {type: 'post', status: 'published'},
    })
  })
})
