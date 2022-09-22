import type {SearchTerms} from '@sanity/base'
import type {CurrentUser, ObjectSchemaType, Schema} from '@sanity/types'
import {versionedClient} from '../../../versionedClient'
import {getSearchableOmnisearchTypes} from '../utils/selectors'

const SEARCH_TERMS_KEY = 'search-terms::recent'
export const MAX_RECENT_SEARCHES = 5
// might come in handy in the future
const CURRENT_VERSION = 1

export type RecentSearchTerms = SearchTerms & {
  __recent: {
    index: number
    timestamp: number
  }
}

export interface RecentSearchesStore {
  addSearchTerm: (searchTerm: SearchTerms) => RecentSearchTerms[]
  getRecentSearchTerms: () => RecentSearchTerms[]
  removeSearchTerms: () => RecentSearchTerms[]
  removeSearchTermAtIndex: (index: number) => RecentSearchTerms[]
}

interface StoredSearch {
  version: number
  recentSearches: StoredSearchItem[]
}

interface StoredSearchItem {
  created: string
  terms: Omit<SearchTerms, 'types'> & {typeNames: string[]}
}

const {projectId, dataset} = versionedClient.config()

export function createRecentSearchesStore(
  schema: Schema,
  user: CurrentUser
): RecentSearchesStore | undefined {
  if (!supportsLocalStorage || !user) {
    return undefined
  }

  const lsKey = `${SEARCH_TERMS_KEY}__${projectId}:${dataset}:${user.id}`

  return {
    /**
     * Write a search term to Local Storage and return updated recent searches.
     */
    addSearchTerm: (searchTerm: SearchTerms): RecentSearchTerms[] => {
      const saveTerm: StoredSearchItem = {
        created: new Date().toISOString(),
        terms: {
          query: searchTerm.query.trim(),
          typeNames: searchTerm.types.map((s) => s.name),
        },
      }
      const comparator = JSON.stringify(saveTerm.terms)
      const newRecent: StoredSearch = {
        version: CURRENT_VERSION,
        recentSearches: [
          saveTerm,
          ...getRecentStoredSearchTerms(lsKey).recentSearches.filter((r) => {
            return JSON.stringify(r.terms) !== comparator
          }),
        ].slice(0, MAX_RECENT_SEARCHES),
      }
      window.localStorage.setItem(lsKey, JSON.stringify(newRecent))

      return getRecentSearchTerms(lsKey, schema)
    },
    /**
     * Fetch all recent searches from Local Storage.
     * Invalid search terms will be filtered out and terms will be re-written to Local Storage.
     */
    getRecentSearchTerms: getRecentSearchTerms.bind(undefined, lsKey, schema),
    /**
     * Remove all search terms from Local Storage and return updated recent searches.
     */
    removeSearchTerms: () => {
      const searchTerms = getRecentStoredSearchTerms(lsKey)

      const newRecent: StoredSearch = {
        ...searchTerms,
        recentSearches: [],
      }

      window.localStorage.setItem(lsKey, JSON.stringify(newRecent))

      return getRecentSearchTerms(lsKey, schema)
    },
    /**
     * Remove a search term from Local Storage and return updated recent searches.
     */
    removeSearchTermAtIndex: (index: number) => {
      const searchTerms = getRecentStoredSearchTerms(lsKey)

      if (index < 0 || index > searchTerms.recentSearches.length) {
        return getRecentSearchTerms(lsKey, schema)
      }

      const newRecent: StoredSearch = {
        ...searchTerms,
        recentSearches: [
          ...searchTerms.recentSearches.slice(0, index),
          ...searchTerms.recentSearches.slice(index + 1),
        ],
      }

      window.localStorage.setItem(lsKey, JSON.stringify(newRecent))

      return getRecentSearchTerms(lsKey, schema)
    },
  }
}

/**
 * Get the 'raw' stored search terms from Local Storage.
 * Stored search terms are the minimal representation of saved terms and only include schema names.
 */
function getRecentStoredSearchTerms(lsKey: string): StoredSearch {
  const recentString = supportsLocalStorage ? window.localStorage.getItem(lsKey) : undefined

  return recentString
    ? (JSON.parse(recentString) as StoredSearch)
    : {version: CURRENT_VERSION, recentSearches: []}
}

/**
 * Get a list of recent searches from Local Storage.
 * Recent searches contain full document schemas.
 */
function getRecentSearchTerms(lsKey: string, schema: Schema): RecentSearchTerms[] {
  const storedSearchTerms = getRecentStoredSearchTerms(lsKey)

  return sanitizeStoredSearchTerms(schema, storedSearchTerms, lsKey)
    .recentSearches.filter((r) => !!r.terms)
    .map((r, index) => ({
      __recent: {
        index,
        timestamp: new Date(r.created).getTime(),
      },
      query: r.terms.query,
      types: r.terms.typeNames
        .map((typeName) => schema.get(typeName))
        .filter((s): s is ObjectSchemaType => s && s.jsonType === 'object'),
    }))
}

/**
 * Sanitize stored search terms - recent searches containing _any_ number of invalid document schemas are removed.
 * Document types hidden from omnisearch with __experimental_omnisearch_visibility are also omitted.
 * This mutates Local Storage if any invalid terms are found.
 */
function sanitizeStoredSearchTerms(
  studioSchema: Schema,
  storedSearchTerms: StoredSearch,
  lsKey: string
): StoredSearch {
  const searchableTypeNames = getSearchableOmnisearchTypes(studioSchema).map(
    (schema) => schema.name
  )

  const filteredSearchTerms = storedSearchTerms.recentSearches.filter((searchTerm) => {
    return searchTerm.terms.typeNames.every((typeName) => searchableTypeNames.includes(typeName))
  })

  const newStoredSearchTerms: StoredSearch = {
    version: CURRENT_VERSION,
    recentSearches: filteredSearchTerms,
  }

  if (newStoredSearchTerms.recentSearches.length < storedSearchTerms.recentSearches.length) {
    window.localStorage.setItem(lsKey, JSON.stringify(newStoredSearchTerms))
  }

  return getRecentStoredSearchTerms(lsKey)
}

const supportsLocalStorage = (() => {
  const key = '__tmp__can_use'
  try {
    if (typeof localStorage === 'undefined') {
      return false
    }

    localStorage.setItem(key, '---')
    localStorage.removeItem(key)
    return true
  } catch (err) {
    return false
  }
})()
