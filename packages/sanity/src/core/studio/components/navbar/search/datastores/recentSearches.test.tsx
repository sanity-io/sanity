/* eslint-disable max-nested-callbacks */
import {Schema} from '@sanity/schema'
import {defineType, type ObjectSchemaType} from '@sanity/types'
import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {type SearchTerms} from '../../../../../search'
import {filterDefinitions} from '../definitions/defaultFilters'
import {createFieldDefinitions} from '../definitions/fields'
import {type SearchFilter} from '../types'
import {MAX_RECENT_SEARCHES, useRecentSearchesStore} from './recentSearches'
import * as useStoredSearchModule from './useStoredSearch'
import {RECENT_SEARCH_VERSION, type StoredSearch} from './useStoredSearch'

// Mock useStoredSearch
vi.mock('./useStoredSearch', async () => ({
  ...((await vi.importActual('./useStoredSearch')) || {}),
  useStoredSearch: vi.fn(),
}))

const mockSchemaTypes = [
  defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [{name: 'name', type: 'string'}],
  }),
  defineType({
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      {name: 'title', type: 'string'},
      {
        name: 'author',
        type: 'reference',
        to: [{type: 'author'}],
      },
    ],
  }),
  defineType({
    // eslint-disable-next-line camelcase
    __experimental_omnisearch_visibility: false,
    name: 'book',
    title: 'Book',
    type: 'document',
    fields: [{name: 'title', type: 'string'}],
  }),
]

const mockSchema = Schema.compile({types: mockSchemaTypes})
const mockArticle: ObjectSchemaType = mockSchema.get('article')
const mockBook: ObjectSchemaType = mockSchema.get('book')

const mockFieldDefinitions = createFieldDefinitions(mockSchema, filterDefinitions)

const constructRecentSearchesStore = async () => {
  const TestWrapper = await createTestProvider({
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      schema: {types: mockSchemaTypes},
    },
  })

  return renderHook(
    () => {
      return useRecentSearchesStore()
    },
    {wrapper: TestWrapper},
  )
}

afterEach(() => {
  window.localStorage.clear()
})

describe('search-store', () => {
  let mockStoredSearch: StoredSearch
  let mockSetStoredSearch: MockedFunction<(newValue: StoredSearch) => void>

  beforeEach(() => {
    mockStoredSearch = {
      version: RECENT_SEARCH_VERSION,
      recentSearches: [],
    }
    mockSetStoredSearch = vi.fn((newValue: StoredSearch) => {
      mockStoredSearch = newValue
    })
    vi.spyOn(useStoredSearchModule, 'useStoredSearch').mockImplementation(() => [
      mockStoredSearch,
      mockSetStoredSearch,
    ])
  })

  describe('getRecentSearchTerms', () => {
    it('should return empty array for empty storage', async () => {
      const {result, rerender} = await constructRecentSearchesStore()
      /*
       * the getRecentSearches function can mutate state,
       * which is warned against in the react-hooks testing library.
       * After calling this we will force a rerender every time to make sure the state is up to date.
       */
      rerender()

      expect(result.current.getRecentSearches()).toEqual([])
    })

    it('should filter out search terms with missing document types', async () => {
      const {result, rerender} = await constructRecentSearchesStore()
      const mockInvalidType = {
        ...mockArticle,
        name: 'invalid',
      }
      const searchTerms1: SearchTerms = {
        query: 'foo',
        types: [mockArticle],
      }
      const searchTerms2: SearchTerms = {
        query: '',
        types: [mockInvalidType],
      }
      const searchTerms3: SearchTerms = {
        query: 'bar',
        types: [mockInvalidType],
      }
      const searchTerms4: SearchTerms = {
        query: 'baz',
        types: [mockArticle, mockInvalidType],
      }

      act(() => {
        result.current.addSearch(searchTerms1)
      })
      rerender()
      act(() => {
        result.current.addSearch(searchTerms2)
      })
      rerender()
      act(() => {
        result.current.addSearch(searchTerms2)
      })
      rerender()
      act(() => {
        result.current.addSearch(searchTerms3)
      })
      rerender()
      act(() => {
        result.current.addSearch(searchTerms4)
      })

      rerender()

      const recentTerms = result.current.getRecentSearches()
      expect(recentTerms.length).toEqual(1)
    })

    it('should filter out search terms with document types hidden from omnisearch', async () => {
      const {result, rerender} = await constructRecentSearchesStore()
      const searchTerms1: SearchTerms = {
        query: 'foo',
        types: [mockArticle],
      }
      const searchTerms2: SearchTerms = {
        query: 'bar',
        types: [mockBook],
      }

      act(() => {
        result.current.addSearch(searchTerms1)
      })

      rerender()

      act(() => {
        result.current.addSearch(searchTerms2)
      })

      rerender()

      const recentTerms = result.current.getRecentSearches()
      expect(recentTerms.length).toEqual(1)
    })

    it('should filter out searches that contain invalid filters', async () => {
      const {result, rerender} = await constructRecentSearchesStore()
      const referenceFieldDef = mockFieldDefinitions.find((def) => def.filterName === 'reference')

      const searchTerms: SearchTerms = {query: 'foo', types: [mockArticle]}
      const invalidFilter1: SearchFilter = {
        filterName: '_invalidFilterType', // invalid filter name
        operatorType: 'defined',
        value: null,
      }
      const invalidFilter2: SearchFilter = {
        filterName: 'datetime',
        operatorType: '_invalidOperatorType', // invalid operator
        value: null,
      }
      const invalidFilter3: SearchFilter = {
        fieldId: '_invalidFieldId', // invalid field Id
        filterName: 'datetime',
        operatorType: 'defined',
        value: null,
      }
      const invalidFilter4: SearchFilter = {
        fieldId: referenceFieldDef?.id,
        filterName: 'reference',
        operatorType: 'referenceEqual',
        // invalid value
        value: {
          assetName: 'qux',
          foo: 'bar',
          id: 123,
        },
      }
      const validFilter1: SearchFilter = {
        fieldId: referenceFieldDef?.id,
        filterName: 'reference',
        operatorType: 'referenceEqual',
        value: {
          _ref: 'foo',
          _type: 'sanity.imageAsset',
        },
      }

      act(() => {
        result.current.addSearch(searchTerms, [invalidFilter1])
      })

      rerender()

      act(() => {
        result.current.addSearch(searchTerms, [invalidFilter2])
      })

      rerender()

      act(() => {
        result.current.addSearch(searchTerms, [invalidFilter3])
      })

      rerender()

      act(() => {
        result.current.addSearch(searchTerms, [invalidFilter4])
      })

      rerender()

      act(() => {
        result.current.addSearch(searchTerms, [validFilter1])
      })

      rerender()

      act(() => {
        result.current.addSearch(searchTerms)
      })

      rerender()
      const recentTerms = result.current.getRecentSearches()
      expect(recentTerms.length).toEqual(2)
    })

    it('should return recent terms', async () => {
      const {result, rerender} = await constructRecentSearchesStore()
      const searchTerms: SearchTerms = {
        query: 'test1',
        types: [mockArticle],
      }

      act(() => {
        result.current.addSearch(searchTerms)
      })

      rerender()
      const recentTerms = result.current.getRecentSearches()

      expect(recentTerms.length).toEqual(1)
      expect(recentTerms[0]).toMatchObject(searchTerms)
    })

    it('should remove duplicate terms', async () => {
      const {result, rerender} = await constructRecentSearchesStore()

      const search1: SearchTerms = {
        query: '1',
        types: [mockArticle],
      }
      const search2: SearchTerms = {
        query: '2',
        types: [mockArticle],
      }

      act(() => {
        result.current.addSearch(search1)
      })

      rerender()

      act(() => {
        result.current.addSearch(search2)
      })

      let recentTerms: SearchTerms[] = []

      rerender()

      recentTerms = result.current.getRecentSearches()
      expect(recentTerms.length).toEqual(2)

      // expect reverse order
      expect(recentTerms[0].query).toBe('2')
      expect(recentTerms[1].query).toBe('1')

      act(() => {
        result.current.addSearch(search1)
      })

      rerender()

      recentTerms = result.current.getRecentSearches()
      // still 2 recent, since duplicate is removed
      expect(recentTerms.length).toEqual(2)

      //expect order to change now, since search1 was more recent
      expect(recentTerms[0].query).toBe('1')
      expect(recentTerms[1].query).toBe('2')
    })

    it('should limit number of saved searches', async () => {
      const {result, rerender} = await constructRecentSearchesStore()

      ;[...Array(MAX_RECENT_SEARCHES + 10).keys()].forEach((i) => {
        act(() =>
          result.current.addSearch({
            query: `${i}`,
            types: [],
          }),
        )
        rerender()
      })

      rerender()
      const recentSearches = result.current.getRecentSearches()
      expect(recentSearches.length).toEqual(MAX_RECENT_SEARCHES)
      expect(recentSearches[0].query).toEqual(`${MAX_RECENT_SEARCHES + 9}`)
    })
  })
  describe('addSearchTerms', () => {
    it('should trim search queries before adding', async () => {
      const {result, rerender} = await constructRecentSearchesStore()
      const searchTerms1: SearchTerms = {
        query: 'foo',
        types: [mockArticle],
      }
      const searchTerms2: SearchTerms = {
        query: ' foo ',
        types: [mockArticle],
      }

      act(() => {
        result.current.addSearch(searchTerms1)
      })

      rerender()
      const recentSearches = result.current.addSearch(searchTerms2)
      expect(recentSearches.length).toEqual(1)
    })
    it('should also include filters', async () => {
      const {result, rerender} = await constructRecentSearchesStore()
      const searchTerms: SearchTerms = {
        query: 'foo',
        types: [mockArticle],
      }
      const stringFieldDef = mockFieldDefinitions.find((def) => def.filterName === 'string')

      const searchFilter: SearchFilter = {
        fieldId: stringFieldDef?.id,
        filterName: 'string',
        operatorType: 'defined',
        value: null,
      }

      rerender()
      const recentSearches = result.current.addSearch(searchTerms, [searchFilter])

      expect(recentSearches[0]?.filters).toEqual([
        {
          fieldId: stringFieldDef?.id,
          filterName: 'string',
          operatorType: 'defined',
          value: null,
        },
      ])
    })
    describe('removeSearchTerms', () => {
      it('should delete all saved searches', async () => {
        const {result, rerender} = await constructRecentSearchesStore()
        const searchTerms1: SearchTerms = {
          query: '1',
          types: [mockArticle],
        }
        const searchTerms2: SearchTerms = {
          query: '2',
          types: [mockArticle],
        }

        act(() => {
          result.current.addSearch(searchTerms1)
        })

        act(() => {
          result.current.addSearch(searchTerms2)
        })

        rerender()
        const recentSearches = result.current.removeSearch()
        expect(recentSearches.length).toEqual(0)
      })
    })
    describe('removeSearchTermAtIndex', () => {
      it('should delete saved searches by index', async () => {
        const {result, rerender} = await constructRecentSearchesStore()
        const searchTerms1: SearchTerms = {
          query: '1',
          types: [mockArticle],
        }
        const searchTerms2: SearchTerms = {
          query: '2',
          types: [mockArticle],
        }

        act(() => {
          result.current.addSearch(searchTerms1)
        })

        rerender()

        act(() => {
          // Added search terms are unshifted
          result.current.addSearch(searchTerms2)
        })

        rerender()
        // This should remove search with query '2'
        const recentSearches = result.current.removeSearchAtIndex(0)

        expect(recentSearches.length).toEqual(1)
        expect(recentSearches[0].query).toEqual('1')
      })

      it('should no-op when deleting out of range indices', async () => {
        const {result, rerender} = await constructRecentSearchesStore()

        let recentSearches = []

        // Add a search term
        await act(async () => {
          result.current.addSearch({query: '1', types: [mockArticle]})
        })

        rerender()

        expect(mockSetStoredSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            recentSearches: expect.arrayContaining([
              {
                created: expect.any(String),
                filters: [],
                terms: {query: '1', typeNames: ['article']},
              },
            ]),
          }),
        )

        rerender()

        recentSearches = result.current.getRecentSearches()
        expect(mockSetStoredSearch).toHaveBeenCalledWith(
          expect.objectContaining({
            recentSearches: [
              {
                created: expect.any(String),
                filters: [],
                terms: {
                  query: '1',
                  typeNames: ['article'],
                },
              },
            ],
            version: 2,
          }),
        )
        expect(recentSearches.length).toBe(1)
        expect(recentSearches[0].query).toBe('1')
        expect(recentSearches[0].filters).toEqual([])

        // Try to remove an out-of-range index
        await act(async () => {
          result.current.removeSearchAtIndex(9000)
        })

        rerender()

        // Check that the search term is still there
        recentSearches = result.current.getRecentSearches()
        expect(recentSearches.length).toBe(1)
        expect(recentSearches[0].query).toBe('1')

        // Try to remove with a negative index
        await act(async () => {
          result.current.removeSearchAtIndex(-1)
        })

        rerender()

        // Check that the search term is still there
        recentSearches = result.current.getRecentSearches()
        expect(recentSearches.length).toBe(1)
        expect(recentSearches[0].query).toBe('1')

        // Verify that setStoredSearch was never called with an empty array
        expect(mockSetStoredSearch).not.toHaveBeenCalledWith(
          expect.objectContaining({
            recentSearches: [],
          }),
        )
      })
    })
  })
})
