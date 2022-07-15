import {useEffect, useRef} from 'react'
import {SEARCH_LIMIT} from '../constants'
import {useSearch} from '../useSearch'
import {useOmnisearch} from './state/OmnisearchContext'

export function SearchController(): null {
  const {
    dispatch,
    state: {pageIndex, result, terms},
  } = useOmnisearch()
  const previousPageIndex = useRef<number>(0)

  const {handleSearch, searchState} = useSearch({
    initialState: {
      searchString: terms.query,
      ...result,
      terms,
    },
    // TODO: consider re-thinking how we handle to search event callbacks
    onComplete: (hits) => dispatch({hits, type: 'SEARCH_REQUEST_COMPLETE'}),
    onError: (error) => dispatch({error, type: 'SEARCH_REQUEST_ERROR'}),
    onStart: () => dispatch({type: 'SEARCH_REQUEST_START'}),
  })

  const hasValidTerms = terms.types.length > 0 || terms.query !== ''

  /**
   * Trigger search when both:
   * 1. either any terms (query or selected types) OR current pageIndex has changed
   * 2. we have a valid, non-empty query
   */
  useEffect(() => {
    const termsChanged = Object.keys(terms).some((key) => terms[key] !== searchState.terms[key])
    const pageIndexChanged = pageIndex !== previousPageIndex.current

    if ((termsChanged || pageIndexChanged) && hasValidTerms) {
      handleSearch({
        ...terms,
        limit: SEARCH_LIMIT,
        offset: pageIndex * SEARCH_LIMIT,
      })

      previousPageIndex.current = pageIndex
    }
  }, [handleSearch, hasValidTerms, pageIndex, searchState.terms, terms])

  /**
   * Reset search hits / state when we have empty search terms (no search query or types)
   */
  useEffect(() => {
    if (!hasValidTerms) {
      dispatch({type: 'SEARCH_CLEAR'})
    }
  }, [dispatch, hasValidTerms, terms.query, terms.types])

  return null
}
