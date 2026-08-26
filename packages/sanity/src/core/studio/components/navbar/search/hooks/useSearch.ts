import {type Schema} from '@sanity/types'
import isEqual from 'lodash-es/isEqual.js'
import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {concat, iif, type Observable, of, Subject, timer} from 'rxjs'
import {catchError, debounce, distinctUntilChanged, map, scan, switchMap, tap} from 'rxjs/operators'

import {useClient} from '../../../../../hooks/useClient'
import {
  type SearchHit,
  type SearchOptions,
  type SearchTerms,
} from '../../../../../search/common/types'
import {createSearch} from '../../../../../search/search'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../../studioClient'
import {useWorkspace} from '../../../../workspace'
import {type SearchState} from '../types'
import {hasSearchableTerms} from '../utils/hasSearchableTerms'
import {getSearchableOmnisearchTypes} from '../utils/selectors'
import {useSearchMaxFieldDepth} from './useSearchMaxFieldDepth'

interface SearchRequest {
  debounceTime?: number
  options?: SearchOptions
  terms: SearchTerms
}

interface SearchEvent {
  onStart?: () => void
  request: SearchRequest
  run: (request: SearchRequest) => Observable<Partial<SearchState>>
}

const DEFAULT_DEBOUNCE_TIME = 300 // ms

const INITIAL_SEARCH_STATE: SearchState = {
  error: null,
  hits: [],
  loading: false,
  terms: {
    query: '',
    types: [],
  },
}

function sanitizeRequest(request: SearchRequest) {
  return {
    ...request,
    terms: {
      ...request.terms,
      filter: request.terms.filter?.trim(),
      query: request.terms.query.trim(),
    },
  }
}

export function useSearch({
  allowEmptyQueries,
  initialState,
  onComplete,
  onError,
  onStart,
  schema,
}: {
  allowEmptyQueries?: boolean
  initialState: SearchState
  onComplete?: (result: {hits: SearchHit[]; nextCursor: string | undefined}) => void
  onError?: (error: Error) => void
  onStart?: () => void
  schema: Schema
}): {
  handleSearch: (request: SearchRequest) => void
  searchState: SearchState
} {
  const [searchRequests$] = useState(() => new Subject<SearchEvent>())
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const maxFieldDepth = useSearchMaxFieldDepth()
  const {strategy} = useWorkspace().search

  const search = useMemo(
    () =>
      createSearch(getSearchableOmnisearchTypes(schema), client, {
        tag: 'search.global',
        unique: true,
        strategy,
        maxDepth: maxFieldDepth,
      }),
    [schema, client, strategy, maxFieldDepth],
  )

  const searchState$ = useMemo(
    () =>
      searchRequests$.pipe(
        // Sanitize request (trim query and filter)
        map((event) => ({...event, request: sanitizeRequest(event.request)})),
        // Only emit when values have changed
        distinctUntilChanged((previous, current) => isEqual(previous.request, current.request)),
        // Debounce requests
        debounce(({request}) => timer(request.debounceTime || DEFAULT_DEBOUNCE_TIME)),
        // Trigger `onStart` callback
        tap(({onStart: handleStart}) => handleStart?.()),
        switchMap(({request, run}) => run(request)),
        scan((prevState, nextState): SearchState => {
          return {...prevState, ...nextState}
        }, INITIAL_SEARCH_STATE),
      ),
    [searchRequests$],
  )
  const searchState = useObservable(searchState$, initialState)

  const handleSearch = useCallback(
    (request: SearchRequest) => {
      searchRequests$.next({
        onStart,
        request,
        run: (sanitizedRequest) =>
          concat(
            // Emit loading start
            of({
              ...INITIAL_SEARCH_STATE,
              loading: true,
              options: sanitizedRequest.options,
              terms: sanitizedRequest.terms,
            }),
            // Conditionally trigger search ONLY if we have valid searchable terms.
            // Typically, search terms are valid if either query, filter or selected types is non-empty.
            // There are exceptions (e.g. searching within <AutoComplete> components) where empty queries are permitted,
            // which is what `allowEmptyQueries` is used for.
            iif(
              () => hasSearchableTerms({allowEmptyQueries, terms: sanitizedRequest.terms}),
              // If we have a valid search, run async fetch, map results and trigger `onComplete` / `onError` callbacks
              search(sanitizedRequest.terms, sanitizedRequest.options).pipe(
                tap(({hits, nextCursor}) => onComplete?.({hits, nextCursor})),
                catchError((error) => {
                  onError?.(error)
                  return of({
                    ...INITIAL_SEARCH_STATE,
                    error,
                    loading: false,
                    options: sanitizedRequest.options,
                    terms: sanitizedRequest.terms,
                  })
                }),
              ),
              // If there is no valid search, emit an empty update and trigger `onComplete`
              of({}).pipe(tap(() => onComplete?.({hits: [], nextCursor: undefined}))),
            ),
            // Emit loading completed
            of({loading: false}),
          ),
      })
    },
    [allowEmptyQueries, onComplete, onError, onStart, search, searchRequests$],
  )

  return {handleSearch, searchState}
}
