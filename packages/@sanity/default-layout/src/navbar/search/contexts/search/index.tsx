import type {SearchTerms} from '@sanity/base'
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
import {INITIAL_SEARCH_STATE, searchReducer, SearchAction, SearchReducerState} from './reducer'

interface SearchContextValue {
  dispatch: Dispatch<SearchAction>
  state: SearchReducerState
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

interface SearchProviderProps {
  children?: ReactNode
}

/**
 * @internal
 */
export function SearchProvider({children}: SearchProviderProps) {
  const [state, dispatch] = useReducer(searchReducer, INITIAL_SEARCH_STATE)

  const {pageIndex, result, terms} = state

  const previousPageIndex = useRef<number>(0)
  const previousTerms = useRef<SearchTerms>(null)

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

  const hasValidTerms = terms.types.length > 0 || terms.query !== ''

  /**
   * Trigger search when both:
   * 1. either any terms (query or selected types) OR current pageIndex has changed
   * 2. we have a valid, non-empty query
   *
   * Note that we compare inbound terms with our last local snapshot, and not the value of
   * `searchState` from `useSearch`, as that only contains a reference to the last _executed_ request,
   * and we may not execute searches when terms change (e.g. no search is run when terms are empty).
   */
  useEffect(() => {
    const termsChanged = Object.keys(terms).some(
      (key) => terms[key] !== previousTerms.current?.[key]
    )
    const pageIndexChanged = pageIndex !== previousPageIndex.current

    if ((termsChanged || pageIndexChanged) && hasValidTerms) {
      handleSearch({
        ...terms,
        limit: SEARCH_LIMIT,
        offset: pageIndex * SEARCH_LIMIT,
      })

      // Update pageIndex snapshot only on a valid search request
      previousPageIndex.current = pageIndex
    }

    // Update our terms snapshot, even if no search request was executed
    previousTerms.current = terms
  }, [handleSearch, hasValidTerms, pageIndex, searchState.terms, terms])

  /**
   * Reset search hits / state when we have empty search terms (no search query or types)
   */
  useEffect(() => {
    if (!hasValidTerms) {
      dispatch({type: 'SEARCH_CLEAR'})
    }
  }, [dispatch, hasValidTerms, terms.query, terms.types])

  return <SearchContext.Provider value={{dispatch, state}}>{children}</SearchContext.Provider>
}

export function useSearchState() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearchState must be used within an SearchProvider')
  }
  return context
}
