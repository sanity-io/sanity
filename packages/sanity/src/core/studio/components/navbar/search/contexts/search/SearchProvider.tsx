import isEqual from 'lodash/isEqual'
import React, {ReactNode, useEffect, useMemo, useReducer, useRef} from 'react'
import {useClient, useSchema} from '../../../../../../hooks'
import type {SearchableType, SearchTerms} from '../../../../../../search'
import {useCurrentUser} from '../../../../../../store'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../../studioClient'
import {FINDABILITY_MVI, SEARCH_LIMIT} from '../../constants'
import {createRecentSearchesStore, RecentSearch} from '../../datastores/recentSearches'
import {useSearch} from '../../hooks/useSearch'
import type {SearchOrdering} from '../../types'
import {createFieldRegistry} from '../../utils/createFieldRegistry'
import {hasSearchableTerms} from '../../utils/hasSearchableTerms'
import {isRecentSearchTerms} from '../../utils/isRecentSearchTerms'
import {initialSearchState, searchReducer} from './reducer'
import {SearchContext} from './SearchContext'
import {useSource} from '../../../../../source'

interface SearchProviderProps {
  children?: ReactNode
}

/**
 * @internal
 */
export function SearchProvider({children}: SearchProviderProps) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema()
  const currentUser = useCurrentUser()
  const {
    search: {operators, filters},
  } = useSource()

  const {dataset, projectId} = client.config()

  // Create our field registry: this is a list of all applicable fields which we can filter on.
  const fieldRegistry = useMemo(() => createFieldRegistry(schema, filters), [schema, filters])

  // Create local storage store
  const recentSearchesStore = useMemo(
    () =>
      createRecentSearchesStore({
        dataset,
        fields: fieldRegistry,
        projectId,
        schema,
        user: currentUser,
      }),
    [currentUser, dataset, fieldRegistry, projectId, schema]
  )

  const recentSearches = useMemo(
    () => recentSearchesStore?.getRecentSearches(),
    [recentSearchesStore]
  )

  const initialState = useMemo(
    () => initialSearchState({currentUser, recentSearches, definitions: {operators, filters}}),
    [currentUser, recentSearches, operators, filters]
  )
  const [state, dispatch] = useReducer(searchReducer, initialState)

  const {documentTypesNarrowed, ordering, pageIndex, result, terms} = state

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

  const hasValidTerms = hasSearchableTerms(terms)

  // Get a narrowed list of document types to search on based on any current active filters.
  const documentTypes = documentTypesNarrowed.map(
    (documentType) => schema.get(documentType) as SearchableType
  )

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
            `findability-mvi:${FINDABILITY_MVI}`,
            ...(isRecentSearchTerms(terms)
              ? [`findability-recent-search:${terms.__recent.index}`]
              : []),
            `findability-selected-types:${terms.types.length}`,
            `findability-sort:${sortLabel}`,
          ],
          limit: SEARCH_LIMIT,
          offset: pageIndex * SEARCH_LIMIT,
          skipSortByScore: ordering.ignoreScore,
          sort: ordering.sort,
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
  }, [documentTypes, handleSearch, hasValidTerms, ordering, pageIndex, searchState.terms, terms])

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
        fieldRegistry,
        recentSearchesStore,
        state,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}
