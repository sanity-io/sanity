import isEqual from 'lodash/isEqual'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import {CommandListHandle} from '../../../../../../components'
import {useClient, useSchema} from '../../../../../../hooks'
import type {SearchableType, SearchTerms} from '../../../../../../search'
import {useCurrentUser} from '../../../../../../store'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../../studioClient'
import {useSource} from '../../../../../source'
import {SEARCH_LIMIT} from '../../constants'
import {
  createRecentSearchesStore,
  RecentSearch,
  RECENT_SEARCH_VERSION,
} from '../../datastores/recentSearches'
import {createFieldDefinitionDictionary, createFieldDefinitions} from '../../definitions/fields'
import {createFilterDefinitionDictionary} from '../../definitions/filters'
import {createOperatorDefinitionDictionary} from '../../definitions/operators'
import {useSearch} from '../../hooks/useSearch'
import type {SearchOrdering} from '../../types'
import {validateFilter} from '../../utils/filterUtils'
import {hasSearchableTerms} from '../../utils/hasSearchableTerms'
import {isRecentSearchTerms} from '../../utils/isRecentSearchTerms'
import {initialSearchState, searchReducer} from './reducer'
import {SearchContext} from './SearchContext'

interface SearchProviderProps {
  children?: ReactNode
  fullscreen?: boolean
}

/**
 * @internal
 */
export function SearchProvider({children, fullscreen}: SearchProviderProps) {
  const onCloseRef = useRef<(() => void) | null>(null)
  const [searchCommandList, setSearchCommandList] = useState<CommandListHandle | null>(null)

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema()
  const currentUser = useCurrentUser()
  const {
    search: {operators, filters},
  } = useSource()

  const {dataset, projectId} = client.config()

  // Create field, filter and operator dictionaries
  const {fieldDefinitions, filterDefinitions, operatorDefinitions} = useMemo(() => {
    return {
      fieldDefinitions: createFieldDefinitionDictionary(createFieldDefinitions(schema, filters)),
      filterDefinitions: createFilterDefinitionDictionary(filters),
      operatorDefinitions: createOperatorDefinitionDictionary(operators),
    }
  }, [filters, operators, schema])

  // Create local storage store
  const recentSearchesStore = useMemo(
    () =>
      createRecentSearchesStore({
        dataset,
        fieldDefinitions,
        filterDefinitions,
        operatorDefinitions,
        projectId,
        schema,
        user: currentUser,
        version: RECENT_SEARCH_VERSION,
      }),
    [
      currentUser,
      dataset,
      fieldDefinitions,
      filterDefinitions,
      operatorDefinitions,
      projectId,
      schema,
    ]
  )

  const recentSearches = useMemo(
    () => recentSearchesStore?.getRecentSearches(),
    [recentSearchesStore]
  )

  const initialState = useMemo(
    () =>
      initialSearchState({
        currentUser,
        fullscreen,
        recentSearches,
        definitions: {
          fields: fieldDefinitions,
          operators: operatorDefinitions,
          filters: filterDefinitions,
        },
      }),
    [
      currentUser,
      fieldDefinitions,
      filterDefinitions,
      fullscreen,
      operatorDefinitions,
      recentSearches,
    ]
  )
  const [state, dispatch] = useReducer(searchReducer, initialState)

  const {documentTypesNarrowed, filters: currentFilters, ordering, pageIndex, result, terms} = state

  const isMountedRef = useRef(false)
  const previousOrderingRef = useRef<SearchOrdering>(initialState.ordering)
  const previousPageIndexRef = useRef<number>(initialState.pageIndex)
  const previousTermsRef = useRef<SearchTerms | RecentSearch>(initialState.terms)

  const {handleSearch, searchState} = useSearch({
    initialState: {...result, terms},
    onComplete: (hits) => dispatch({hits, type: 'SEARCH_REQUEST_COMPLETE'}),
    onError: (error) => dispatch({error, type: 'SEARCH_REQUEST_ERROR'}),
    onStart: () => dispatch({type: 'SEARCH_REQUEST_START'}),
    schema,
  })

  const hasValidTerms = hasSearchableTerms({terms})

  // Get a narrowed list of document types to search on based on any current active filters.
  const documentTypes = documentTypesNarrowed.map(
    (documentType) => schema.get(documentType) as SearchableType
  )

  // Get a list of 'complete' filters (filters that return valid values)
  const completeFilters = currentFilters.filter((filter) =>
    validateFilter({
      fieldDefinitions,
      filter,
      filterDefinitions,
      operatorDefinitions,
    })
  )

  const handleSetOnClose = useCallback((onClose: () => void) => {
    onCloseRef.current = onClose
  }, [])

  /**
   * Trigger search when any terms (query or selected types) OR current pageIndex has changed
   *
   * Note that we compare inbound terms with our last local snapshot, and not the value of
   * `searchState` from `useSearch`, as that only contains a reference to the last fully _executed_ request.
   * There are cases were we may not run searches when terms change (e.g. when search terms are empty / invalid).
   */
  useEffect(() => {
    const orderingChanged = !isEqual(ordering, previousOrderingRef.current)
    const pageIndexChanged = pageIndex !== previousPageIndexRef.current
    const termsChanged = !isEqual(terms, previousTermsRef.current)

    if (orderingChanged || pageIndexChanged || termsChanged) {
      // Use a custom label if provided, otherwise return field and direction, e.g. `_updatedAt desc`
      const sortLabel =
        ordering?.customMeasurementLabel || `${ordering.sort.field} ${ordering.sort.direction}`

      handleSearch({
        options: {
          // Comments prepended to each query for future measurement
          comments: [
            ...(isRecentSearchTerms(terms)
              ? [`findability-recent-search:${terms.__recent.index}`]
              : []),
            `findability-selected-types:${terms.types.length}`,
            `findability-sort:${sortLabel}`,
            `findability-source: global`,
            `findability-filter-count:${completeFilters.length}`,
          ],
          limit: SEARCH_LIMIT,
          offset: pageIndex * SEARCH_LIMIT,
          skipSortByScore: ordering.ignoreScore,
          sort: [ordering.sort],
        },
        terms: {
          ...terms,
          // Narrow document type search
          ...(documentTypes ? {types: documentTypes} : {}),
        },
      })

      // Update pageIndex snapshot only on a valid search request
      previousPageIndexRef.current = pageIndex
    }

    // Update snapshots, even if no search request was executed
    previousOrderingRef.current = ordering
    previousTermsRef.current = terms
  }, [
    completeFilters.length,
    currentFilters,
    documentTypes,
    handleSearch,
    hasValidTerms,
    ordering,
    pageIndex,
    searchState.terms,
    terms,
  ])

  /**
   * Reset search hits / state when (after initial amount):
   * - we have no valid search terms and
   * - we have existing hits
   */
  useEffect(() => {
    if (!hasValidTerms && isMountedRef?.current && result.hits.length > 0) {
      dispatch({type: 'SEARCH_CLEAR'})
    }

    isMountedRef.current = true
  }, [dispatch, hasValidTerms, result.hits, terms.query, terms.types])

  return (
    <SearchContext.Provider
      value={{
        dispatch,
        onClose: onCloseRef?.current,
        recentSearchesStore,
        searchCommandList,
        setSearchCommandList,
        setOnClose: handleSetOnClose,
        state: {
          ...state,
          fullscreen,
        },
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}
