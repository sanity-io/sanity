import {type ObjectSchemaType, type Schema} from '@sanity/types'
import {isEqual, omit} from 'lodash'
import {useMemo} from 'react'

import {useSchema} from '../../../../../hooks'
import {type SearchTerms} from '../../../../../search'
import {useSource} from '../../../../source'
import {
  createFieldDefinitionDictionary,
  createFieldDefinitions,
  type SearchFieldDefinitionDictionary,
} from '../definitions/fields'
import {
  createFilterDefinitionDictionary,
  type SearchFilterDefinitionDictionary,
} from '../definitions/filters'
import {
  createOperatorDefinitionDictionary,
  type SearchOperatorDefinitionDictionary,
} from '../definitions/operators'
import {type SearchFilter} from '../types'
import {validateFilter} from '../utils/filterUtils'
import {getSearchableOmnisearchTypes} from '../utils/selectors'
import {useStoredSearch} from './useStoredSearch'

export const MAX_RECENT_SEARCHES = 5
/**
 * Current recent search version.
 *
 * Users with recent searches containing mismatching versions will have their recent searches cleared.
 * This value should only be incremented when search filter operator `value` data types are updated,
 * ensuring that users don't have stored recent searches containing invalid operator values.
 *
 * This is a bit of a blunt instrument: in future we could look to validate individual filter values and
 * remove outdated entries individually.
 */
export const RECENT_SEARCH_VERSION = 2

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

export function useRecentSearchesStore(): RecentSearchesStore {
  const [storedSearch, setStoredSearch] = useStoredSearch()
  const schema = useSchema()
  const {
    search: {operators, filters},
  } = useSource()

  // Create field, filter and operator dictionaries
  const {fieldDefinitions, filterDefinitions, operatorDefinitions} = useMemo(() => {
    return {
      fieldDefinitions: createFieldDefinitionDictionary(createFieldDefinitions(schema, filters)),
      filterDefinitions: createFilterDefinitionDictionary(filters),
      operatorDefinitions: createOperatorDefinitionDictionary(operators),
    }
  }, [filters, operators, schema])

  return {
    /**
     * Write a search term to Local Storage and return updated recent searches.
     */
    addSearch: (searchTerm: SearchTerms, searchFilters?: SearchFilter[]): RecentSearch[] => {
      const storedFilters = (searchFilters || []).map(
        (filter): SearchFilter => ({
          fieldId: filter.fieldId,
          filterName: filter.filterName,
          operatorType: filter.operatorType,
          value: filter.value,
        }),
      )

      // Remove any filters in 'incomplete' states prior to writing to local storage.
      const validStoredFilters = storedFilters.filter((filter) =>
        validateFilter({
          fieldDefinitions,
          filter,
          filterDefinitions,
          operatorDefinitions,
        }),
      )

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
      const newRecent: StoredSearch = {
        version: RECENT_SEARCH_VERSION,
        recentSearches: [
          newSearchItem,
          ...storedSearch.recentSearches.filter((r) => {
            return !isEqual(omit(r, 'created'), omit(newSearchItem, 'created'))
          }),
        ].slice(0, MAX_RECENT_SEARCHES),
      }
      setStoredSearch(newRecent)

      return getRecentSearchTerms({
        fieldDefinitions,
        filterDefinitions,
        operatorDefinitions,
        schema,
        storedSearch: newRecent,
        setStoredSearch,
      })
    },
    /**
     * Fetch all recent searches from Local Storage.
     * Invalid search terms will be filtered out and terms will be re-written to Local Storage.
     */
    getRecentSearches: () =>
      getRecentSearchTerms({
        fieldDefinitions,
        filterDefinitions,
        operatorDefinitions,
        schema,
        storedSearch,
        setStoredSearch,
      }),
    /**
     * Remove all search terms from Local Storage and return updated recent searches.
     */
    removeSearch: () => {
      const newRecent: StoredSearch = {
        ...storedSearch,
        recentSearches: [],
      }

      setStoredSearch(newRecent)

      return getRecentSearchTerms({
        fieldDefinitions,
        filterDefinitions,
        operatorDefinitions,
        schema,
        storedSearch: newRecent,
        setStoredSearch,
      })
    },
    /**
     * Remove a search term from Local Storage and return updated recent searches.
     */
    removeSearchAtIndex: (index: number) => {
      if (index < 0 || index > storedSearch.recentSearches.length) {
        return getRecentSearchTerms({
          fieldDefinitions,
          filterDefinitions,
          operatorDefinitions,
          schema,
          storedSearch,
          setStoredSearch,
        })
      }

      const newRecent: StoredSearch = {
        ...storedSearch,
        recentSearches: [
          ...storedSearch.recentSearches.slice(0, index),
          ...storedSearch.recentSearches.slice(index + 1),
        ],
      }

      setStoredSearch(newRecent)

      return getRecentSearchTerms({
        fieldDefinitions,
        filterDefinitions,
        operatorDefinitions,
        schema,
        storedSearch: newRecent,
        setStoredSearch,
      })
    },
  }
}

/**
 * Get a list of recent searches from Local Storage.
 * Recent searches contain full document schema types.
 */
function getRecentSearchTerms({
  schema,
  fieldDefinitions,
  filterDefinitions,
  operatorDefinitions,
  storedSearch,
  setStoredSearch,
}: {
  schema: Schema
  fieldDefinitions: SearchFieldDefinitionDictionary
  filterDefinitions: SearchFilterDefinitionDictionary
  operatorDefinitions: SearchOperatorDefinitionDictionary
  storedSearch: StoredSearch
  setStoredSearch: (_value: StoredSearch) => void
}): RecentSearch[] {
  return sanitizeStoredSearch({
    studioSchema: schema,
    filterDefinitions,
    fieldDefinitions,
    operatorDefinitions,
    storedSearch,
    setStoredSearch,
  })
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
 * Sanitize stored search.
 *
 * Ignore searches containing:
 * - Any number of invalid document schema types
 * - Document types hidden from omnisearch with __experimental_omnisearch_visibility
 * - Invalid filters
 *
 * This mutates Local Storage if any invalid terms are found.
 */
function sanitizeStoredSearch({
  fieldDefinitions,
  filterDefinitions,
  operatorDefinitions,
  studioSchema,
  storedSearch,
  setStoredSearch,
}: {
  fieldDefinitions: SearchFieldDefinitionDictionary
  filterDefinitions: SearchFilterDefinitionDictionary
  operatorDefinitions: SearchOperatorDefinitionDictionary
  studioSchema: Schema
  storedSearch: StoredSearch
  setStoredSearch: (_value: StoredSearch) => void
}): StoredSearch {
  // Obtain all 'searchable' type names – defined as a type that exists in
  // the current schema and also visible to omnisearch.
  const searchableTypeNames = getSearchableOmnisearchTypes(studioSchema).map(
    (schema) => schema.name,
  )

  const filteredSearch = storedSearch.recentSearches.filter((recentSearch) => {
    return (
      // Has valid searchable types (not hidden by omnisearch)
      recentSearch.terms.typeNames.every((typeName) => searchableTypeNames.includes(typeName)) &&
      recentSearch.filters.every((filter) =>
        validateFilter({fieldDefinitions, filter, filterDefinitions, operatorDefinitions}),
      )
    )
  })

  const newStoredSearch: StoredSearch = {
    version: RECENT_SEARCH_VERSION,
    recentSearches: filteredSearch,
  }

  if (newStoredSearch.recentSearches.length < storedSearch.recentSearches.length) {
    setStoredSearch(newStoredSearch)
  }

  return newStoredSearch
}
