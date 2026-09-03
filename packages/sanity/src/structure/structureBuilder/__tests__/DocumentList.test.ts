import {describe, expect, test} from 'vitest'

import {DocumentListBuilder} from '../DocumentList'
import {type StructureContext} from '../types'

const mockContext = {} as StructureContext

function createDocumentList() {
  return new DocumentListBuilder(mockContext)
    .id('posts')
    .title('Posts')
    .filter('published == true')
    .apiVersion('2025-01-01')
}

describe('DocumentListBuilder filter options', () => {
  test('sets, gets, and serializes filter options without mutating the original builder', () => {
    const original = createDocumentList()
    const filterOptions = [
      {
        id: 'featured',
        title: 'Featured',
        filter: 'featured == true',
      },
    ]
    const configured = original.filterOptions(filterOptions)

    expect(original.getFilterOptions()).toBeUndefined()
    expect(configured.getFilterOptions()).toBe(filterOptions)
    expect(configured.serialize().options.filterOptions).toEqual(filterOptions)
  })

  test('rejects non-array filter options', () => {
    expect(() => createDocumentList().filterOptions(null!)).toThrow(
      '`filterOptions` must be an array',
    )
  })

  test('rejects duplicate filter option IDs', () => {
    const builder = createDocumentList().filterOptions([
      {id: 'featured', title: 'Featured', filter: 'featured == true'},
      {id: 'featured', title: 'Not featured', filter: 'featured != true'},
    ])

    expect(() => builder.serialize()).toThrow(
      'Filter option IDs must be unique, but "featured" is duplicated',
    )
  })

  test('rejects query-shaped filter option values', () => {
    const builder = createDocumentList().filterOptions([
      {id: 'featured', title: 'Featured', filter: '*[_type == "post"]'},
    ])

    expect(() => builder.serialize()).toThrow(
      '`filter` cannot start with `*` - looks like you are providing a query, not a filter',
    )
  })
})
