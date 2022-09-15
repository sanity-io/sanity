// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {SearchTerms} from '@sanity/base'
import type {CurrentUser} from '@sanity/types'
import {isEqual} from 'lodash'
import schema from 'part:@sanity/base/schema'
import React, {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import {FINDABILITY_MVI, SEARCH_LIMIT} from '../../constants'
import {
  createRecentSearchesStore,
  RecentSearchesStore,
  RecentSearchTerms,
} from '../../datastores/recentSearches'
import {useSearch} from '../../hooks/useSearch'
import type {SearchOrdering} from '../../types'
import {hasSearchableTerms} from '../../utils/hasSearchableTerms'
import {isRecentSearchTerms} from '../../utils/isRecentSearchTerms'
import {initialSearchState, SearchAction, searchReducer, SearchReducerState} from './reducer'

interface SearchContextValue {
  dispatch: Dispatch<SearchAction>
  state: SearchReducerState
  recentSearchesStore?: RecentSearchesStore
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

interface SearchProviderProps {
  children?: ReactNode
  currentUser: CurrentUser
}

/**
 * @internal
 */
export function SearchProvider({children, currentUser}: SearchProviderProps) {
  // Create local storage store
  const recentSearchesStore = useMemo(() => createRecentSearchesStore(schema, currentUser), [
    currentUser,
  ])

  const recentSearches = useMemo(() => recentSearchesStore?.getRecentSearchTerms(), [
    recentSearchesStore,
  ])

  const initialState = useMemo(() => initialSearchState(currentUser, recentSearches), [
    currentUser,
    recentSearches,
  ])
  const [state, dispatch] = useReducer(searchReducer, initialState)

  const {ordering, pageIndex, result, terms} = state

  const isMountedRef = useRef(false)
  const previousOrderingRef = useRef<SearchOrdering>(initialState.ordering)
  const previousPageIndexRef = useRef<number>(initialState.pageIndex)
  const previousTermsRef = useRef<SearchTerms | RecentSearchTerms>(initialState.terms)

  const {handleSearch, searchState} = useSearch({
    initialState: {...result, terms},
    onComplete: (hits) => dispatch({hits, type: 'SEARCH_REQUEST_COMPLETE'}),
    onError: (error) => dispatch({error, type: 'SEARCH_REQUEST_ERROR'}),
    onStart: () => dispatch({type: 'SEARCH_REQUEST_START'}),
  })

  const hasValidTerms = hasSearchableTerms(terms)

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
            ...(isRecentSearchTerms(terms) ? [`findability-recent-search:${terms.__index}`] : []),
            `findability-selected-types:${terms.types.length}`,
            `findability-sort:${sortLabel}`,
          ],
          limit: SEARCH_LIMIT,
          offset: pageIndex * SEARCH_LIMIT,
          skipSortByScore: ordering.ignoreScore,
          sort: ordering.sort,
        },
        terms,
      })

      // Update pageIndex snapshot only on a valid search request
      previousPageIndexRef.current = pageIndex
    }

    // Update snapshots, even if no search request was executed
    previousOrderingRef.current = ordering
    previousTermsRef.current = terms
  }, [handleSearch, hasValidTerms, ordering, pageIndex, searchState.terms, terms])

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
    <SearchContext.Provider value={{dispatch, recentSearchesStore, state}}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearchState() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearchState must be used within an SearchProvider')
  }
  return context
}
