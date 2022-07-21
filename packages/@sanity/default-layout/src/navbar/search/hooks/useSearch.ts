// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {useState, useCallback} from 'react'
import {useObservableCallback} from 'react-rx'
import {
  distinctUntilChanged,
  catchError,
  debounceTime,
  map,
  switchMap,
  tap,
  filter,
  scan,
} from 'rxjs/operators'
import {concat, Observable, of} from 'rxjs'
import search from 'part:@sanity/base/search'
import type {SearchTerms} from '@sanity/base'
import {SearchHit, SearchState} from '../types'

type SearchFunction = (params: SearchTerms) => Observable<SearchHit[]>

const INITIAL_SEARCH_STATE: SearchState = {
  hits: [],
  loading: false,
  error: null,
  terms: {
    query: '',
    types: [],
  },
  searchString: '',
}

function nonNullable<T>(v: T): v is NonNullable<T> {
  return v !== null
}

export function useSearch(
  {
    initialState,
    onComplete,
    onError,
    onStart,
  }: {
    initialState: SearchState
    onComplete?: (hits: SearchHit[]) => void
    onError?: (error: Error) => void
    onStart?: () => void
  } = {
    initialState: INITIAL_SEARCH_STATE,
  }
): {
  handleSearch: (params: string | SearchTerms) => void
  handleClearSearch: () => void
  searchState: SearchState
} {
  const [searchState, setSearchState] = useState(initialState)

  const onSearch: SearchFunction = useCallback((params) => {
    return params.query === '' && !params.types.length ? of([]) : search(params)
  }, [])

  const handleQueryChange = useObservableCallback((inputValue$: Observable<SearchTerms | null>) => {
    return inputValue$.pipe(
      distinctUntilChanged(),
      filter(nonNullable),
      debounceTime(300),
      tap(onStart),
      switchMap((terms) =>
        concat(
          of({...INITIAL_SEARCH_STATE, loading: true, terms, searchString: terms.query}),
          onSearch(terms).pipe(
            map((hits) => ({hits})),
            tap(({hits}) => onComplete?.(hits)),
            catchError((error) => {
              onError?.(error)
              return of({
                ...INITIAL_SEARCH_STATE,
                loading: false,
                error,
                terms,
                searchString: terms.query,
              })
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
    handleQueryChange(INITIAL_SEARCH_STATE.terms) // cancel current request
  }, [handleQueryChange])

  const handleSearch = useCallback(
    (params: string | SearchTerms) =>
      handleQueryChange(typeof params === 'string' ? {query: params, types: []} : params),
    [handleQueryChange]
  )

  return {handleSearch, handleClearSearch, searchState}
}
