// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {useState, useCallback} from 'react'
import {useObservableCallback} from 'react-rx'
import {
  distinctUntilChanged,
  catchError,
  map,
  switchMap,
  tap,
  filter,
  scan,
  mergeMapTo,
} from 'rxjs/operators'
import type {Observable} from 'rxjs'
import {concat, EMPTY, of, timer} from 'rxjs'
import search from 'part:@sanity/base/search'
import type {SearchHit, SearchState} from './types'

type SearchFunction = (query: string) => Observable<SearchHit[]>

const INITIAL_SEARCH_STATE: SearchState = {
  hits: [],
  loading: false,
  error: null,
  searchString: '',
}

function nonNullable<T>(v: T): v is NonNullable<T> {
  return v !== null
}

export function useSearch(): {
  handleSearch: (searchString: string) => void
  handleClearSearch: () => void
  searchState: SearchState
} {
  const [searchState, setSearchState] = useState<SearchState>(INITIAL_SEARCH_STATE)

  const onSearch: SearchFunction = useCallback((query) => {
    return query === '' ? of([]) : search(query)
  }, [])

  const handleQueryChange = useObservableCallback((inputValue$: Observable<string | null>) => {
    return inputValue$.pipe(
      distinctUntilChanged(),
      filter(nonNullable),
      switchMap((searchString) =>
        concat(
          of({hits: [], error: null, loading: true, searchString: searchString}),
          timer(100).pipe(mergeMapTo(EMPTY)),
          onSearch(searchString).pipe(
            map((hits) => ({hits})),
            catchError((error) => {
              return of({hits: [], error: error, loading: false, searchString: searchString})
            })
          ),
          of({loading: false})
        )
      ),
      scan((prevState, nextState): SearchState => {
        return {...prevState, ...nextState}
      }, INITIAL_SEARCH_STATE),
      tap(setSearchState)
    )
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchState(INITIAL_SEARCH_STATE)
    handleQueryChange('') // cancel current request
  }, [handleQueryChange])

  const handleSearch = useCallback(
    (searchString: string) => {
      handleQueryChange(searchString)
    },
    [handleQueryChange]
  )

  return {handleSearch, handleClearSearch, searchState}
}
