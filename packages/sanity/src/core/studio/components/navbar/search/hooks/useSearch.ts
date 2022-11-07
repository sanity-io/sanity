import type {Schema} from '@sanity/types'
import isEqual from 'lodash/isEqual'
import {useCallback, useMemo, useState} from 'react'
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
import {useClient} from '../../../../../hooks'
import {createWeightedSearch, SearchOptions, SearchTerms, WeightedHit} from '../../../../../search'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import type {SearchState} from '../types'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {getSearchableOmnisearchTypes} from '../utils/selectors'

interface SearchRequest {
  options?: SearchOptions
  terms: SearchTerms
}

const INITIAL_SEARCH_STATE: SearchState = {
  error: null,
  hits: [],
  loading: false,
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

export function useSearch({
  initialState,
  onComplete,
  onError,
  onStart,
  schema,
}: {
  initialState: SearchState
  onComplete?: (hits: WeightedHit[]) => void
  onError?: (error: Error) => void
  onStart?: () => void
  schema: Schema
}): {
  handleSearch: (request: SearchRequest) => void
  handleClearSearch: () => void
  searchState: SearchState
} {
  const [searchState, setSearchState] = useState(initialState)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const searchWeighted = useMemo(
    () =>
      createWeightedSearch(getSearchableOmnisearchTypes(schema), client, {
        tag: 'search.global',
        unique: true,
      }),
    [client, schema]
  )

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
            (searchWeighted(request.terms, request.options) as Observable<WeightedHit[]>).pipe(
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
    // TODO: understand why onComplete isn't being triggered when defined in this dependency array, re-enable
    []
    // [onComplete, onError, onStart, searchWeighted]
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
