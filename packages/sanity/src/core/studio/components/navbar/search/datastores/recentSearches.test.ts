import Schema from '@sanity/schema'
import type {CurrentUser, ObjectSchemaType} from '@sanity/types'
import type {SearchTerms} from '../search/weighted/types'
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

const mockUser: CurrentUser = {
  id: 'mock-user',
  name: 'mock user',
  email: 'mockUser@example.com',
  role: '',
  roles: [],
}

const recentSearchesStore = createRecentSearchesStore({
  dataset: 'dataset',
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
      const recentSearches = recentSearchesStore.getRecentSearchTerms()
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
      recentSearchesStore.addSearchTerm(searchTerms1)
      recentSearchesStore.addSearchTerm(searchTerms2)
      recentSearchesStore.addSearchTerm(searchTerms3)
      recentSearchesStore.addSearchTerm(searchTerms4)
      const recentTerms = recentSearchesStore.getRecentSearchTerms()

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
      recentSearchesStore.addSearchTerm(searchTerms1)
      recentSearchesStore.addSearchTerm(searchTerms2)
      const recentTerms = recentSearchesStore.getRecentSearchTerms()

      expect(recentTerms.length).toEqual(1)
    })

    it('should return recent terms', () => {
      const searchTerms: SearchTerms = {
        query: 'test1',
        types: [mockArticle],
      }
      recentSearchesStore.addSearchTerm(searchTerms)
      const recentTerms = recentSearchesStore.getRecentSearchTerms()

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
      recentSearchesStore.addSearchTerm(search1)
      recentSearchesStore.addSearchTerm(search2)

      let recentTerms = recentSearchesStore.getRecentSearchTerms()
      expect(recentTerms.length).toEqual(2)
      // expect reverse order
      expect(recentTerms[0]).toMatchObject(search2)
      expect(recentTerms[1]).toMatchObject(search1)

      recentSearchesStore.addSearchTerm(search1)
      recentTerms = recentSearchesStore.getRecentSearchTerms()

      // still 2 recent, since duplicate is removed
      expect(recentTerms.length).toEqual(2)

      //expect order to change now, since search1 was more recent
      expect(recentTerms[0]).toMatchObject(search1)
      expect(recentTerms[1]).toMatchObject(search2)
    })

    it('it should limit number of saved searches', () => {
      // eslint-disable-next-line max-nested-callbacks
      ;[...Array(MAX_RECENT_SEARCHES + 10).keys()].forEach((i) =>
        recentSearchesStore.addSearchTerm({
          query: `${i}`,
          types: [],
        })
      )

      const recentSearches = recentSearchesStore.getRecentSearchTerms()
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

      recentSearchesStore.addSearchTerm(searchTerms1)
      const recentSearches = recentSearchesStore.addSearchTerm(searchTerms2)

      expect(recentSearches.length).toEqual(1)
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

      recentSearchesStore.addSearchTerm(searchTerms1)
      recentSearchesStore.addSearchTerm(searchTerms2)

      const recentSearches = recentSearchesStore.removeSearchTerms()

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
      recentSearchesStore.addSearchTerm(searchTerms1)
      recentSearchesStore.addSearchTerm(searchTerms2)

      // This should remove search with query '2'
      const recentSearches = recentSearchesStore.removeSearchTermAtIndex(0)

      expect(recentSearches.length).toEqual(1)
      expect(recentSearches[0].query).toEqual('1')
    })

    it('should no-op when deleting out of range indices', () => {
      const searchTerms: SearchTerms = {
        query: '1',
        types: [mockArticle],
      }

      recentSearchesStore.addSearchTerm(searchTerms)
      recentSearchesStore.removeSearchTermAtIndex(9000)

      let recentSearches = recentSearchesStore.getRecentSearchTerms()
      expect(recentSearches.length).toEqual(1)

      recentSearchesStore.removeSearchTermAtIndex(-1)
      recentSearches = recentSearchesStore.getRecentSearchTerms()
      expect(recentSearches.length).toEqual(1)
    })
  })
})
