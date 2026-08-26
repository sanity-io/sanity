import {type Schema} from '@sanity/types'
import isEqual from 'lodash-es/isEqual.js'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useObservable} from 'react-rx'
import {concat, iif, of, Subject, timer} from 'rxjs'
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
  const [searchRequests$] = useState(() => new Subject<SearchRequest>())
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

  // Everything the pipeline needs beyond the request itself is read when a
  // search event fires: the callbacks are props that can change identity every
  // render, and `search` settles asynchronously (`useSearchMaxFieldDepth`).
  // Rebuilding the pipeline on them instead would cancel in-flight searches
  // without replay, stranding the loading state, and reset the debounce,
  // dedupe, and accumulated search state.
  const latestRef = useRef({allowEmptyQueries, onComplete, onError, onStart, search})
  useEffect(() => {
    latestRef.current = {allowEmptyQueries, onComplete, onError, onStart, search}
  }, [allowEmptyQueries, onComplete, onError, onStart, search])

  const searchState$ = useMemo(
    () =>
      searchRequests$.pipe(
        // Sanitize request (trim query and filter)
        map(sanitizeRequest),
        // Only emit when values have changed
        distinctUntilChanged(isEqual),
        // Debounce requests
        debounce((request) => timer(request.debounceTime || DEFAULT_DEBOUNCE_TIME)),
        // oxlint-disable-next-line react/refs -- the ref is read when the subject emits, never during render
        switchMap((request) => {
          const latest = latestRef.current
          latest.onStart?.()
          return concat(
            // Emit loading start
            of({
              ...INITIAL_SEARCH_STATE,
              loading: true,
              options: request.options,
              terms: request.terms,
            }),
            // Conditionally trigger search ONLY if we have valid searchable terms.
            // Typically, search terms are valid if either query, filter or selected types is non-empty.
            // There are exceptions (e.g. searching within <AutoComplete> components) where empty queries are permitted,
            // which is what `allowEmptyQueries` is used for.
            iif(
              () =>
                hasSearchableTerms({
                  allowEmptyQueries: latest.allowEmptyQueries,
                  terms: request.terms,
                }),
              // If we have a valid search, run async fetch, map results and trigger `onComplete` / `onError` callbacks
              latest.search(request.terms, request.options).pipe(
                tap(({hits, nextCursor}) => latest.onComplete?.({hits, nextCursor})),
                catchError((error) => {
                  latest.onError?.(error)
                  return of({
                    ...INITIAL_SEARCH_STATE,
                    error,
                    loading: false,
                    options: request.options,
                    terms: request.terms,
                  })
                }),
              ),
              // If there is no valid search, emit an empty update and trigger `onComplete`
              of({}).pipe(tap(() => latest.onComplete?.({hits: [], nextCursor: undefined}))),
            ),
            // Emit loading completed
            of({loading: false}),
          )
        }),
        scan((prevState, nextState): SearchState => {
          return {...prevState, ...nextState}
        }, INITIAL_SEARCH_STATE),
      ),
    [searchRequests$],
  )
  // Captured once, like the `useState(initialState)` mirror it replaces: both
  // callers rebuild the object every render, and react-rx re-reads an unstable
  // initial value on every snapshot until the first emission.
  const [initialSearchState] = useState(initialState)
  const searchState = useObservable(searchState$, initialSearchState)

  const handleSearch = useCallback(
    (searchRequest: SearchRequest) => searchRequests$.next(searchRequest),
    [searchRequests$],
  )

  return {handleSearch, searchState}
}
