import {useEffect, useRef} from 'react'
import {SEARCH_LIMIT} from '../constants'
import {useSearch} from '../useSearch'
import {useOmnisearch} from './state/OmnisearchContext'

export function SearchController(): null {
  const {
    dispatch,
    state: {pageIndex, result, terms},
  } = useOmnisearch()
  const isMounted = useRef(false)
  const previousPageIndex = useRef<number>(null)

  const {handleSearch, searchState} = useSearch({
    searchString: terms.query,
    ...result,
    terms,
  })

  // Trigger search when either any terms (query or types) or current pageIndex has changed
  useEffect(() => {
    if (
      Object.keys(terms).some((key) => terms[key] !== searchState.terms[key]) ||
      pageIndex !== previousPageIndex.current
    ) {
      handleSearch({
        ...terms,
        limit: SEARCH_LIMIT,
        offset: pageIndex * SEARCH_LIMIT,
      })

      previousPageIndex.current = pageIndex
    }
  }, [handleSearch, pageIndex, searchState.terms, terms])

  // Update locally stored hits new results from search (after mount)
  useEffect(() => {
    if (isMounted.current && searchState.hits) {
      dispatch({
        hits: searchState.hits,
        type: 'RESULT_HITS_APPEND',
      })
    }
  }, [dispatch, searchState.hits])

  // Clear hits when terms have changed (after mount)
  useEffect(() => {
    if (isMounted.current) {
      dispatch({type: 'RESULT_HITS_CLEAR'})
    }
  }, [dispatch, terms])

  // Update search result loading / error state (after mount)
  useEffect(() => {
    if (isMounted.current) {
      dispatch({
        result: {
          loading: searchState.loading,
          error: searchState.error,
        },
        type: 'RESULT_SET',
      })
    }
  }, [dispatch, searchState.error, searchState.loading])

  useEffect(() => {
    isMounted.current = true
  }, [])

  return null
}
