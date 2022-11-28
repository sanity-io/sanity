import {CalendarIcon} from '@sanity/icons'
import Schema from '@sanity/schema'
import type {CurrentUser, ObjectSchemaType} from '@sanity/types'
import type {SearchTerms} from '../../../../../search'
import {defineSearchFilter, SearchFilterDefinition} from '../definitions/filters'
import {SearchOperator} from '../definitions/operators'
import {SearchFilter} from '../types'
import {createFieldDefinitions} from '../utils/createFieldDefinitions'
import {createRecentSearchesStore, MAX_RECENT_SEARCHES, RecentSearchesStore} from './recentSearches'

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'article',
      title: 'Article',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
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
const mockFilterDefinitions: SearchFilterDefinition[] = [
  defineSearchFilter({
    fieldType: 'datetime',
    icon: CalendarIcon,
    operators: [
      {name: 'defined', type: 'item'},
      {name: 'notDefined', type: 'item'},
    ],
    title: 'Datetime',
    name: 'datetime',
  }),
]
const mockOperatorDefinitions: SearchOperator[] = []

const mockUser: CurrentUser = {
  id: 'mock-user',
  name: 'mock user',
  email: 'mockUser@example.com',
  role: '',
  roles: [],
}

const mockFieldDefinitions = createFieldDefinitions(mockSchema, mockFilterDefinitions)

const recentSearchesStore = createRecentSearchesStore({
  dataset: 'dataset',
  fieldDefinitions: mockFieldDefinitions,
  filterDefinitions: mockFilterDefinitions,
  operatorDefinitions: mockOperatorDefinitions,
  projectId: ' projectId',
  schema: mockSchema,
  user: mockUser,
}) as RecentSearchesStore

afterEach(() => {
  window.localStorage.clear()
})

describe('search-store', () => {
  describe('getRecentSearchTerms', () => {
    it('should return empty array for empty storage', () => {
      const recentSearches = recentSearchesStore.getRecentSearches()
      expect(recentSearches).toEqual([])
    })

    it('should filter out search terms with missing document types', () => {
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
      recentSearchesStore.addSearch(searchTerms1)
      recentSearchesStore.addSearch(searchTerms2)
      recentSearchesStore.addSearch(searchTerms3)
      recentSearchesStore.addSearch(searchTerms4)
      const recentTerms = recentSearchesStore.getRecentSearches()

      expect(recentTerms.length).toEqual(1)
    })

    it('should filter out search terms with document types hidden from omnisearch', () => {
      const searchTerms1: SearchTerms = {
        query: 'foo',
        types: [mockArticle],
      }
      const searchTerms2: SearchTerms = {
        query: 'bar',
        types: [mockBook],
      }
      recentSearchesStore.addSearch(searchTerms1)
      recentSearchesStore.addSearch(searchTerms2)
      const recentTerms = recentSearchesStore.getRecentSearches()

      expect(recentTerms.length).toEqual(1)
    })

    it('should filter out searches that contain invalid filters', () => {
      const searchTerms1: SearchTerms = {query: 'foo', types: [mockArticle]}
      const searchTerms2: SearchTerms = {query: 'bar', types: [mockArticle]}
      const searchTerms3: SearchTerms = {query: 'baz', types: [mockArticle]}
      const searchTerms4: SearchTerms = {query: 'qux', types: [mockArticle]}
      const invalidFilter1: SearchFilter = {
        filterType: 'datetime',
        operatorType: 'defined',
        value: null,
      }
      const invalidFilter2: SearchFilter = {
        filterType: '_invalidFilterType',
        operatorType: 'defined',
        value: null,
      }
      const invalidFilter3: SearchFilter = {
        filterType: 'datetime',
        operatorType: '_invalidOperatorType',
        value: null,
      }

      recentSearchesStore.addSearch(searchTerms1, [invalidFilter1])
      recentSearchesStore.addSearch(searchTerms2, [invalidFilter2])
      recentSearchesStore.addSearch(searchTerms3, [invalidFilter3])
      recentSearchesStore.addSearch(searchTerms4)
      const recentTerms = recentSearchesStore.getRecentSearches()
      expect(recentTerms.length).toEqual(1)
    })

    it('should return recent terms', () => {
      const searchTerms: SearchTerms = {
        query: 'test1',
        types: [mockArticle],
      }
      recentSearchesStore.addSearch(searchTerms)
      const recentTerms = recentSearchesStore.getRecentSearches()

      expect(recentTerms.length).toEqual(1)
      expect(recentTerms[0]).toMatchObject(searchTerms)
    })

    it('should remove duplicate terms', () => {
      const search1: SearchTerms = {
        query: '1',
        types: [mockArticle],
      }
      const search2: SearchTerms = {
        query: '2',
        types: [mockArticle],
      }
      recentSearchesStore.addSearch(search1)
      recentSearchesStore.addSearch(search2)

      let recentTerms = recentSearchesStore.getRecentSearches()
      expect(recentTerms.length).toEqual(2)
      // expect reverse order
      expect(recentTerms[0]).toMatchObject(search2)
      expect(recentTerms[1]).toMatchObject(search1)

      recentSearchesStore.addSearch(search1)
      recentTerms = recentSearchesStore.getRecentSearches()

      // still 2 recent, since duplicate is removed
      expect(recentTerms.length).toEqual(2)

      //expect order to change now, since search1 was more recent
      expect(recentTerms[0]).toMatchObject(search1)
      expect(recentTerms[1]).toMatchObject(search2)
    })

    it('it should limit number of saved searches', () => {
      // eslint-disable-next-line max-nested-callbacks
      ;[...Array(MAX_RECENT_SEARCHES + 10).keys()].forEach((i) =>
        recentSearchesStore.addSearch({
          query: `${i}`,
          types: [],
        })
      )

      const recentSearches = recentSearchesStore.getRecentSearches()
      expect(recentSearches.length).toEqual(MAX_RECENT_SEARCHES)
      expect(recentSearches[0].query).toEqual(`${MAX_RECENT_SEARCHES + 9}`)
    })
  })
  describe('addSearchTerms', () => {
    it('should trim search queries before adding', () => {
      const searchTerms1: SearchTerms = {
        query: 'foo',
        types: [mockArticle],
      }
      const searchTerms2: SearchTerms = {
        query: ' foo ',
        types: [mockArticle],
      }

      recentSearchesStore.addSearch(searchTerms1)
      const recentSearches = recentSearchesStore.addSearch(searchTerms2)

      expect(recentSearches.length).toEqual(1)
    })
    it('should also include filters', () => {
      const searchTerms: SearchTerms = {
        query: 'foo',
        types: [mockArticle],
      }
      // eslint-disable-next-line max-nested-callbacks
      const fieldId = mockFieldDefinitions.find((def) => def.filterType === 'datetime')?.id
      const searchFilter: SearchFilter = {
        fieldId,
        filterType: 'datetime',
        operatorType: 'defined',
        value: null,
      }
      const recentSearches = recentSearchesStore.addSearch(searchTerms, [searchFilter])
      expect(recentSearches[0].filters).toEqual([
        {
          fieldId,
          filterType: 'datetime',
          operatorType: 'defined',
          value: null,
        },
      ])
    })
  })
  describe('removeSearchTerms', () => {
    it('should delete all saved searches', () => {
      const searchTerms1: SearchTerms = {
        query: '1',
        types: [mockArticle],
      }
      const searchTerms2: SearchTerms = {
        query: '2',
        types: [mockArticle],
      }

      recentSearchesStore.addSearch(searchTerms1)
      recentSearchesStore.addSearch(searchTerms2)

      const recentSearches = recentSearchesStore.removeSearch()

      expect(recentSearches.length).toEqual(0)
    })
  })
  describe('removeSearchTermAtIndex', () => {
    it('should delete saved searches by index', () => {
      const searchTerms1: SearchTerms = {
        query: '1',
        types: [mockArticle],
      }
      const searchTerms2: SearchTerms = {
        query: '2',
        types: [mockArticle],
      }

      // Added search terms are unshifted
      recentSearchesStore.addSearch(searchTerms1)
      recentSearchesStore.addSearch(searchTerms2)

      // This should remove search with query '2'
      const recentSearches = recentSearchesStore.removeSearchAtIndex(0)

      expect(recentSearches.length).toEqual(1)
      expect(recentSearches[0].query).toEqual('1')
    })

    it('should no-op when deleting out of range indices', () => {
      const searchTerms: SearchTerms = {
        query: '1',
        types: [mockArticle],
      }

      recentSearchesStore.addSearch(searchTerms)
      recentSearchesStore.removeSearchAtIndex(9000)

      let recentSearches = recentSearchesStore.getRecentSearches()
      expect(recentSearches.length).toEqual(1)

      recentSearchesStore.removeSearchAtIndex(-1)
      recentSearches = recentSearchesStore.getRecentSearches()
      expect(recentSearches.length).toEqual(1)
    })
  })
})
