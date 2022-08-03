import {ObjectSchemaType} from '@sanity/types'
import {
  addSearchTerm,
  getRecentSearchTerms,
  MAX_RECENT_SEARCHES,
  removeSearchTermAtIndex,
  removeSearchTerms,
} from './recentSearches'

const dummyType = ({name: 'testSchema', jsonType: 'object'} as unknown) as ObjectSchemaType
const dummySchema = {
  get: (name) => (name === dummyType.name ? dummyType : undefined),
}

afterEach(() => {
  window.localStorage.clear()
})

describe('search-store', () => {
  describe('getRecentSearchTerms', () => {
    it('should return empty array for empty storage', () => {
      const recentTerms = getRecentSearchTerms({get: () => undefined})
      expect(recentTerms).toEqual([])
    })

    it('should return recent terms', () => {
      const searchTerms = {
        query: 'test1',
        types: [dummyType],
      }
      addSearchTerm(searchTerms)
      const recentTerms = getRecentSearchTerms(dummySchema)
      expect(recentTerms.length).toEqual(1)
      expect(recentTerms[0]).toMatchObject(searchTerms)
    })

    it('should remove duplicate terms', () => {
      const search1 = {
        query: '1',
        types: [dummyType],
      }
      const search2 = {
        query: '2',
        types: [dummyType],
      }
      addSearchTerm(search1)
      addSearchTerm(search2)

      let recentTerms = getRecentSearchTerms(dummySchema)
      expect(recentTerms.length).toEqual(2)
      // expect reverse order
      expect(recentTerms[0]).toMatchObject(search2)
      expect(recentTerms[1]).toMatchObject(search1)

      addSearchTerm(search1)

      recentTerms = getRecentSearchTerms(dummySchema)
      // still 2 recent, since duplicate is removed
      expect(recentTerms.length).toEqual(2)

      //expect order to change now, since search1 was more recent
      expect(recentTerms[0]).toMatchObject(search1)
      expect(recentTerms[1]).toMatchObject(search2)
    })

    it('it should limit number of saved searches', () => {
      ;[...Array(MAX_RECENT_SEARCHES + 10).keys()].forEach((i) =>
        addSearchTerm({
          query: `${i}`,
          types: [],
        })
      )

      const recentTerms = getRecentSearchTerms(dummySchema)
      expect(recentTerms.length).toEqual(MAX_RECENT_SEARCHES)
      expect(recentTerms[0].query).toEqual(`${MAX_RECENT_SEARCHES + 9}`)
    })

    it('should delete all saved searches', () => {
      const search1 = {
        query: '1',
        types: [dummyType],
      }
      const search2 = {
        query: '2',
        types: [dummyType],
      }

      addSearchTerm(search1)
      addSearchTerm(search2)

      removeSearchTerms()

      const recentTerms = getRecentSearchTerms(dummySchema)

      expect(recentTerms.length).toEqual(0)
    })

    it('should delete saved searches by index', () => {
      const search1 = {
        query: '1',
        types: [dummyType],
      }
      const search2 = {
        query: '2',
        types: [dummyType],
      }

      // Added search terms are unshifted
      addSearchTerm(search1)
      addSearchTerm(search2)

      // This should remove search with query '2'
      removeSearchTermAtIndex(0)

      const recentTerms = getRecentSearchTerms(dummySchema)

      expect(recentTerms.length).toEqual(1)
      expect(recentTerms[0].query).toEqual('1')
    })

    it('should no-op when deleting out of range indices', () => {
      const search1 = {
        query: '1',
        types: [dummyType],
      }

      addSearchTerm(search1)
      removeSearchTermAtIndex(9000)

      let recentTerms = getRecentSearchTerms(dummySchema)
      expect(recentTerms.length).toEqual(1)

      removeSearchTermAtIndex(-1)
      recentTerms = getRecentSearchTerms(dummySchema)
      expect(recentTerms.length).toEqual(1)
    })
  })
})
