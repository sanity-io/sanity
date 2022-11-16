import type {CurrentUser, ObjectSchemaType, Schema} from '@sanity/types'
import omit from 'lodash/omit'
import type {SearchTerms} from '../../../../../search'
import type {SearchFilterDefinition} from '../definitions/filters'
import {getOperator, SearchOperator} from '../definitions/operators'
import type {SearchFieldDefinition, SearchFilter} from '../types'
import {getSearchableOmnisearchTypes} from '../utils/selectors'

const RECENT_SEARCHES_KEY = 'search::recent'
export const MAX_RECENT_SEARCHES = 5
// might come in handy in the future
const CURRENT_VERSION = 1

export type RecentSearch = SearchTerms & {
  __recent: {
    index: number
    timestamp: number
  }
  filters?: SearchFilter[]
}

export interface RecentSearchesStore {
  addSearch: (searchTerm: SearchTerms, filters?: SearchFilter[]) => RecentSearch[]
  getRecentSearches: () => RecentSearch[]
  removeSearch: () => RecentSearch[]
  removeSearchAtIndex: (index: number) => RecentSearch[]
}

interface StoredSearch {
  version: number
  recentSearches: StoredSearchItem[]
}

interface StoredSearchItem {
  created: string
  filters: SearchFilter[]
  terms: Omit<SearchTerms, 'types'> & {typeNames: string[]}
}

export function createRecentSearchesStore({
  dataset,
  fieldDefinitions,
  filterDefinitions,
  operatorDefinitions,
  projectId,
  schema,
  user,
}: {
  dataset?: string
  fieldDefinitions: SearchFieldDefinition[]
  filterDefinitions: SearchFilterDefinition[]
  operatorDefinitions: SearchOperator[]
  projectId?: string
  schema: Schema
  user: CurrentUser | null
}): RecentSearchesStore | undefined {
  if (!dataset || !projectId || !supportsLocalStorage || !user) {
    return undefined
  }

  const lsKey = `${RECENT_SEARCHES_KEY}__${projectId}:${dataset}:${user.id}`

  return {
    /**
     * Write a search term to Local Storage and return updated recent searches.
     */
    addSearch: (searchTerm: SearchTerms, filters?: SearchFilter[]): RecentSearch[] => {
      const storedFilters = (filters || []).map(
        (filter): SearchFilter => ({
          fieldId: filter.fieldId,
          filterType: filter.filterType,
          operatorType: filter.operatorType,
          value: filter.value,
        })
      )

      // Remove filters in 'incomplete' states prior to writing to local storage.
      // Filters are defined as incomplete if they _can_ contain a value (`initialValue` is present)
      // and they are undefined or null value.
      const validStoredFilters = storedFilters.filter((filter) => {
        const operator = getOperator(operatorDefinitions, filter.operatorType)
        if (typeof operator?.initialValue !== 'undefined') {
          return filter.value !== undefined && filter.value !== null
        }
        return true
      })

      const newSearchItem: StoredSearchItem = {
        created: new Date().toISOString(),
        filters: validStoredFilters,
        terms: {
          query: searchTerm.query.trim(),
          typeNames: searchTerm.types.map((s) => s.name),
        },
      }
      // Add new search item, remove previous duplicates (if any) and truncate array.
      // When comparing search items, don't compare against the created date (which will always be different).
      const comparator = JSON.stringify(omit(newSearchItem, 'created'))
      const newRecent: StoredSearch = {
        version: CURRENT_VERSION,
        recentSearches: [
          newSearchItem,
          ...getRecentStoredSearch(lsKey).recentSearches.filter((r) => {
            return JSON.stringify(omit(r, 'created')) !== comparator
          }),
        ].slice(0, MAX_RECENT_SEARCHES),
      }
      window.localStorage.setItem(lsKey, JSON.stringify(newRecent))

      return getRecentSearchTerms(lsKey, schema, fieldDefinitions, filterDefinitions)
    },
    /**
     * Fetch all recent searches from Local Storage.
     * Invalid search terms will be filtered out and terms will be re-written to Local Storage.
     */
    getRecentSearches: getRecentSearchTerms.bind(
      undefined,
      lsKey,
      schema,
      fieldDefinitions,
      filterDefinitions
    ),
    /**
     * Remove all search terms from Local Storage and return updated recent searches.
     */
    removeSearch: () => {
      const searchTerms = getRecentStoredSearch(lsKey)

      const newRecent: StoredSearch = {
        ...searchTerms,
        recentSearches: [],
      }

      window.localStorage.setItem(lsKey, JSON.stringify(newRecent))

      return getRecentSearchTerms(lsKey, schema, fieldDefinitions, filterDefinitions)
    },
    /**
     * Remove a search term from Local Storage and return updated recent searches.
     */
    removeSearchAtIndex: (index: number) => {
      const searchTerms = getRecentStoredSearch(lsKey)

      if (index < 0 || index > searchTerms.recentSearches.length) {
        return getRecentSearchTerms(lsKey, schema, fieldDefinitions, filterDefinitions)
      }

      const newRecent: StoredSearch = {
        ...searchTerms,
        recentSearches: [
          ...searchTerms.recentSearches.slice(0, index),
          ...searchTerms.recentSearches.slice(index + 1),
        ],
      }

      window.localStorage.setItem(lsKey, JSON.stringify(newRecent))

      return getRecentSearchTerms(lsKey, schema, fieldDefinitions, filterDefinitions)
    },
  }
}

/**
 * Get the 'raw' stored search terms from Local Storage.
 * Stored search terms are the minimal representation of saved terms and only include schema names.
 */
function getRecentStoredSearch(lsKey: string): StoredSearch {
  const recentString = supportsLocalStorage ? window.localStorage.getItem(lsKey) : undefined

  return recentString
    ? (JSON.parse(recentString) as StoredSearch)
    : {version: CURRENT_VERSION, recentSearches: []}
}

/**
 * Get a list of recent searches from Local Storage.
 * Recent searches contain full document schemas.
 */
function getRecentSearchTerms(
  lsKey: string,
  schema: Schema,
  fieldDefinitions: SearchFieldDefinition[],
  filterDefinitions: SearchFilterDefinition[]
): RecentSearch[] {
  const storedSearchTerms = getRecentStoredSearch(lsKey)

  return sanitizeStoredSearch(schema, storedSearchTerms, lsKey, filterDefinitions, fieldDefinitions)
    .recentSearches.filter((r) => !!r.terms)
    .map((r, index) => ({
      __recent: {
        index,
        timestamp: new Date(r.created).getTime(),
      },
      filters: r.filters,
      query: r.terms.query,
      types: r.terms.typeNames
        .map((typeName) => schema.get(typeName))
        .filter((s): s is ObjectSchemaType => !!(s && s.jsonType === 'object')),
    }))
}

/**
 * Sanitize stored search. Ignore searches containing:
 * - Any number of invalid document schemas
 * - Document types hidden from omnisearch with __experimental_omnisearch_visibility
 * - Invalid filters
 *
 * This mutates Local Storage if any invalid terms are found.
 */
function sanitizeStoredSearch(
  studioSchema: Schema,
  storedSearch: StoredSearch,
  lsKey: string,
  filterDefinitions: SearchFilterDefinition[],
  fieldDefinitions: SearchFieldDefinition[]
): StoredSearch {
  // Obtain all 'searchable' type names – defined as a type that exists in
  // the current schema and also visible to omnisearch.
  const searchableTypeNames = getSearchableOmnisearchTypes(studioSchema).map(
    (schema) => schema.name
  )

  const filteredSearch = storedSearch.recentSearches.filter((recentSearch) => {
    return (
      recentSearch.terms.typeNames.every((typeName) => searchableTypeNames.includes(typeName)) &&
      recentSearch.filters.every((filter) =>
        validateFilter(filter, filterDefinitions, fieldDefinitions)
      )
    )
  })

  const newStoredSearch: StoredSearch = {
    version: CURRENT_VERSION,
    recentSearches: filteredSearch,
  }

  if (newStoredSearch.recentSearches.length < storedSearch.recentSearches.length) {
    window.localStorage.setItem(lsKey, JSON.stringify(newStoredSearch))
  }

  return getRecentStoredSearch(lsKey)
}

function validateFilter(
  filter: SearchFilter,
  filterDefinitions: SearchFilterDefinition[],
  fieldDefinitions: SearchFieldDefinition[]
): boolean {
  const filterDefinition = filterDefinitions.find((f) => f.type === filter.filterType)
  if (!filterDefinition) {
    return false
  }

  if (filter.operatorType) {
    if (
      !filterDefinition.operators.find((o) => o.type === 'item' && o.name === filter.operatorType)
    ) {
      return false
    }
  }

  if (filter.fieldId) {
    if (!fieldDefinitions.find((f) => f.id === filter.fieldId)) {
      return false
    }
  }

  if (!filter.fieldId && filterDefinition.fieldType) {
    return false
  }

  return true
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
