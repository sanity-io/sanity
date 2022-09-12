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
import {hasSearchableTerms} from '../contexts/search/selectors'
import {SearchState} from '../types'

interface SearchRequest {
  options?: SearchOptions
  terms: SearchTerms
}

const INITIAL_SEARCH_STATE: SearchState = {
  error: null,
  hits: [],
  loading: false,
  options: {},
  terms: {
    query: '',
    types: [],
  },
}

function nonNullable<T>(v: T): v is NonNullable<T> {
  return v !== null
}

function sanitizeRequest(request: SearchRequest) {
  return {
    ...request,
    terms: {
      ...request.terms,
      query: request.terms.query.trim(),
    },
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
  handleSearch: (request: SearchRequest) => void
  handleClearSearch: () => void
  searchState: SearchState
} {
  const [searchState, setSearchState] = useState(initialState)

  const handleQueryChange = useObservableCallback(
    (inputValue$: Observable<SearchRequest | null>) => {
      return inputValue$.pipe(
        filter(nonNullable),
        map(sanitizeRequest),
        distinctUntilChanged(isEqual),
        filter((request: SearchRequest) => hasSearchableTerms(request.terms)),
        debounceTime(300),
        tap(onStart),
        switchMap((request) =>
          concat(
            of({
              ...INITIAL_SEARCH_STATE,
              loading: true,
              options: request.options,
              terms: request.terms,
            }),
            (search(request.terms, request.options) as Observable<WeightedHit[]>).pipe(
              map((hits) => ({hits})),
              tap(({hits}) => onComplete?.(hits)),
              catchError((error) => {
                onError?.(error)
                return of({
                  ...INITIAL_SEARCH_STATE,
                  error,
                  loading: false,
                  options: request.options,
                  terms: request.terms,
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
    },
    []
  )

  const handleClearSearch = useCallback(() => {
    setSearchState(INITIAL_SEARCH_STATE)
    handleQueryChange({terms: INITIAL_SEARCH_STATE.terms}) // cancel current request
  }, [handleQueryChange])

  const handleSearch = useCallback(
    (searchRequest: SearchRequest) => handleQueryChange(searchRequest),
    [handleQueryChange]
  )

  return {handleSearch, handleClearSearch, searchState}
}
