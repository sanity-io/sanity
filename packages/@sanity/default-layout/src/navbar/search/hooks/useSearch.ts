// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import type {SearchOptions, SearchTerms, WeightedHit} from '@sanity/base'
import {isEqual} from 'lodash'
import search from 'part:@sanity/base/search'
import {useCallback, useState} from 'react'
import {useObservableCallback} from 'react-rx'
import {concat, Observable, of} from 'rxjs'
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  scan,
  switchMap,
  tap,
} from 'rxjs/operators'
import {FINDABILITY_MVI} from '../constants'
import {hasSearchableTerms} from '../contexts/search/selectors'
import {SearchState} from '../types'

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

function sanitizeTerms(terms: SearchTerms) {
  return {
    ...terms,
    query: terms.query.trim(),
  }
}

export function useSearch(
  {
    initialState,
    onComplete,
    onError,
    onStart,
  }: {
    initialState: SearchState
    onComplete?: (hits: WeightedHit[]) => void
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

  const handleQueryChange = useObservableCallback((inputValue$: Observable<SearchTerms | null>) => {
    return inputValue$.pipe(
      filter(nonNullable),
      map(sanitizeTerms),
      distinctUntilChanged(isEqual),
      filter(hasSearchableTerms),
      debounceTime(300),
      tap(onStart),
      switchMap((terms) => {
        // Comments prepended to each query for future measurement
        const searchComments = [
          `findability-mvi:${FINDABILITY_MVI}`,
          `findability-selected-types:${terms.types.length}`,
        ]
        return concat(
          of({...INITIAL_SEARCH_STATE, loading: true, terms, searchString: terms.query}),
          (search(terms, {}, searchComments) as Observable<WeightedHit[]>).pipe(
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
      }),
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
