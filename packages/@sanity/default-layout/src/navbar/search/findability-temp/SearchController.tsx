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

  return null
}
