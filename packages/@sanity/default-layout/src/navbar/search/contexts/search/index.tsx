import type {SearchTerms} from '@sanity/base'
import {CurrentUser} from '@sanity/types'
import React, {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react'
import {SEARCH_LIMIT} from '../../constants'
import {useSearch} from '../../hooks/useSearch'
import {initialSearchState, searchReducer, SearchAction, SearchReducerState} from './reducer'
import {hasSearchableTerms} from './selectors'

interface SearchContextValue {
  dispatch: Dispatch<SearchAction>
  state: SearchReducerState
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
  const [state, dispatch] = useReducer(searchReducer, initialSearchState(currentUser))

  const {pageIndex, result, terms} = state

  const isMountedRef = useRef(false)
  const previousPageIndexRef = useRef<number>(0)
  const previousTermsRef = useRef<SearchTerms>(null)

  const {handleSearch, searchState} = useSearch({
    initialState: {
      searchString: terms.query,
      ...result,
      terms,
    },
    // TODO: consider re-thinking how we handle search event callbacks
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
    const termsChanged = Object.keys(terms).some(
      (key) => terms[key] !== previousTermsRef.current?.[key]
    )
    const pageIndexChanged = pageIndex !== previousPageIndexRef.current

    if (termsChanged || pageIndexChanged) {
      handleSearch({
        ...terms,
        limit: SEARCH_LIMIT,
        offset: pageIndex * SEARCH_LIMIT,
      })

      // Update pageIndex snapshot only on a valid search request
      previousPageIndexRef.current = pageIndex
    }

    // Update our terms snapshot, even if no search request was executed
    previousTermsRef.current = terms
  }, [handleSearch, hasValidTerms, pageIndex, searchState.terms, terms])

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

  return <SearchContext.Provider value={{dispatch, state}}>{children}</SearchContext.Provider>
}

export function useSearchState() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearchState must be used within an SearchProvider')
  }
  return context
}
