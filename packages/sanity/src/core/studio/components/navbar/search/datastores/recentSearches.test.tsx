/* eslint-disable max-nested-callbacks */
import {afterEach, describe, expect, it} from '@jest/globals'
import {Schema} from '@sanity/schema'
import {type CurrentUser, type ObjectSchemaType} from '@sanity/types'
import {act, renderHook, waitFor} from '@testing-library/react'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {type SearchTerms} from '../../../../../search'
import {filterDefinitions} from '../definitions/defaultFilters'
import {createFieldDefinitionDictionary, createFieldDefinitions} from '../definitions/fields'
import {createFilterDefinitionDictionary} from '../definitions/filters'
import {createOperatorDefinitionDictionary} from '../definitions/operators'
import {operatorDefinitions} from '../definitions/operators/defaultOperators'
import {type SearchFilter} from '../types'
import {MAX_RECENT_SEARCHES, useRecentSearchesStore} from './recentSearches'

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'author',
      title: 'Author',
      type: 'document',
      fields: [{name: 'name', type: 'string'}],
    },
    {
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
    },
    {
      // eslint-disable-next-line camelcase
      __experimental_omnisearch_visibility: false,
      name: 'book',
      title: 'Book',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
  ],
})
const mockArticle: ObjectSchemaType = mockSchema.get('article')
const mockBook: ObjectSchemaType = mockSchema.get('book')

const mockUser: CurrentUser = {
  id: 'mock-user',
  name: 'mock user',
  email: 'mockUser@example.com',
  role: '',
  roles: [],
}

const mockFieldDefinitions = createFieldDefinitions(mockSchema, filterDefinitions)

const fieldDefinitionDictionary = createFieldDefinitionDictionary(mockFieldDefinitions)
const filterDefinitionDictionary = createFilterDefinitionDictionary(filterDefinitions)
const operatorDefinitionDictionary = createOperatorDefinitionDictionary(operatorDefinitions)

const recentSearchesStoreDefinition = {
  fieldDefinitions: fieldDefinitionDictionary,
  filterDefinitions: filterDefinitionDictionary,
  operatorDefinitions: operatorDefinitionDictionary,
  schema: mockSchema,
}

afterEach(() => {
  window.localStorage.clear()
})

const constructRecentSearchesStore = async () => {
  const TestWrapper = await createTestProvider()

  return renderHook(
    () => {
      return useRecentSearchesStore(recentSearchesStoreDefinition)
    },
    {wrapper: TestWrapper},
  )
}

describe('search-store', () => {
  describe('getRecentSearchTerms', () => {
    it('should return empty array for empty storage', async () => {
      const {result} = await constructRecentSearchesStore()
      /*
       * the getRecentSearches function can mutate state,
       * which is warned against in the react-hooks testing library.
       * All calls and dependencies on this function
       * are wrapped in a waitFor block to manage rerenders and updated state.
       */
      await waitFor(() => {
        expect(result.current.getRecentSearches()).toEqual([])
      })
    })

    it('should filter out search terms with missing document types', async () => {
      const {result} = await constructRecentSearchesStore()
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
      act(() => {
        result.current.addSearch(searchTerms2)
      })
      act(() => {
        result.current.addSearch(searchTerms2)
      })
      act(() => {
        result.current.addSearch(searchTerms3)
      })
      act(() => {
        result.current.addSearch(searchTerms4)
      })

      await waitFor(() => {
        const recentTerms = result.current.getRecentSearches()
        expect(recentTerms.length).toEqual(1)
      })
    })

    it('should filter out search terms with document types hidden from omnisearch', async () => {
      const {result} = await constructRecentSearchesStore()
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

      act(() => {
        result.current.addSearch(searchTerms2)
      })

      await waitFor(() => {
        const recentTerms = result.current.getRecentSearches()
        expect(recentTerms.length).toEqual(1)
      })
    })

    it('should filter out searches that contain invalid filters', async () => {
      const {result} = await constructRecentSearchesStore()
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

      act(() => {
        result.current.addSearch(searchTerms, [invalidFilter2])
      })

      act(() => {
        result.current.addSearch(searchTerms, [invalidFilter3])
      })

      act(() => {
        result.current.addSearch(searchTerms, [invalidFilter4])
      })

      act(() => {
        result.current.addSearch(searchTerms, [validFilter1])
      })

      act(() => {
        result.current.addSearch(searchTerms)
      })

      await waitFor(() => {
        const recentTerms = result.current.getRecentSearches()
        expect(recentTerms.length).toEqual(2)
      })
    })

    it('should return recent terms', async () => {
      const {result} = await constructRecentSearchesStore()
      const searchTerms: SearchTerms = {
        query: 'test1',
        types: [mockArticle],
      }

      act(() => {
        result.current.addSearch(searchTerms)
      })

      await waitFor(() => {
        const recentTerms = result.current.getRecentSearches()

        expect(recentTerms.length).toEqual(1)
        expect(recentTerms[0]).toMatchObject(searchTerms)
      })
    })

    it('should remove duplicate terms', async () => {
      const {result} = await constructRecentSearchesStore()
      const recentSearchesStore = result.current

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

      act(() => {
        result.current.addSearch(search2)
      })

      let recentTerms: SearchTerms[] = []

      await waitFor(() => {
        recentTerms = result.current.getRecentSearches()
        expect(recentTerms.length).toEqual(2)
        // expect reverse order
        expect(recentTerms[0]).toMatchObject(search2)
        expect(recentTerms[1]).toMatchObject(search1)
      })

      act(() => {
        result.current.addSearch(search1)
      })

      await waitFor(() => {
        recentTerms = result.current.getRecentSearches()

        // still 2 recent, since duplicate is removed
        expect(recentTerms.length).toEqual(2)

        //expect order to change now, since search1 was more recent
        expect(recentTerms[0]).toMatchObject(search1)
        expect(recentTerms[1]).toMatchObject(search2)
      })
    })

    it('should limit number of saved searches', async () => {
      const {result} = await constructRecentSearchesStore()

      ;[...Array(MAX_RECENT_SEARCHES + 10).keys()].forEach((i) =>
        act(() =>
          result.current.addSearch({
            query: `${i}`,
            types: [],
          }),
        ),
      )

      await waitFor(() => {
        const recentSearches = result.current.getRecentSearches()
        expect(recentSearches.length).toEqual(MAX_RECENT_SEARCHES)
        expect(recentSearches[0].query).toEqual(`${MAX_RECENT_SEARCHES + 9}`)
      })
    })
  })
  describe('addSearchTerms', () => {
    it('should trim search queries before adding', async () => {
      const {result} = await constructRecentSearchesStore()
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

      await waitFor(() => {
        const recentSearches = result.current.addSearch(searchTerms2)
        expect(recentSearches.length).toEqual(1)
      })
    })
    it('should also include filters', async () => {
      const {result} = await constructRecentSearchesStore()
      const searchTerms: SearchTerms = {
        query: 'foo',
        types: [mockArticle],
      }
      // eslint-disable-next-line max-nested-callbacks
      const stringFieldDef = mockFieldDefinitions.find((def) => def.filterName === 'string')

      const searchFilter: SearchFilter = {
        fieldId: stringFieldDef?.id,
        filterName: 'string',
        operatorType: 'defined',
        value: null,
      }

      await waitFor(() => {
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
    })
    // })
    describe('removeSearchTerms', () => {
      it('should delete all saved searches', async () => {
        const {result} = await constructRecentSearchesStore()
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

        await waitFor(() => {
          const recentSearches = result.current.removeSearch()
          expect(recentSearches.length).toEqual(0)
        })
      })
    })
    describe('removeSearchTermAtIndex', () => {
      it('should delete saved searches by index', async () => {
        const {result} = await constructRecentSearchesStore()
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
          // Added search terms are unshifted
          result.current.addSearch(searchTerms2)
        })

        await waitFor(() => {
          // This should remove search with query '2'
          const recentSearches = result.current.removeSearchAtIndex(0)

          expect(recentSearches.length).toEqual(1)
          expect(recentSearches[0].query).toEqual('1')
        })
      })

      it('should no-op when deleting out of range indices', async () => {
        const {result} = await constructRecentSearchesStore()
        const searchTerms: SearchTerms = {
          query: '1',
          types: [mockArticle],
        }

        act(() => {
          result.current.addSearch(searchTerms)
        })

        act(() => {
          result.current.removeSearchAtIndex(9000)
        })

        let recentSearches = []

        await waitFor(() => {
          recentSearches = result.current.getRecentSearches()
          expect(recentSearches.length).toEqual(1)
        })

        act(() => {
          result.current.removeSearchAtIndex(-1)
        })

        await waitFor(() => {
          recentSearches = result.current.getRecentSearches()
          expect(recentSearches.length).toEqual(1)
        })
      })
    })
  })
})
