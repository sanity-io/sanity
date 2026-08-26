import {type Schema} from '@sanity/types'
import isEqual from 'lodash-es/isEqual.js'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {concat, iif, of, Subject, timer} from 'rxjs'
import {
  catchError,
  debounce,
  distinctUntilChanged,
  filter,
  map,
  scan,
  switchMap,
  tap,
} from 'rxjs/operators'
import {useEffectEvent} from 'use-effect-event'

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

function nonNullable<T>(v: T): v is NonNullable<T> {
  return v !== null
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
  const [searchState, setSearchState] = useState(initialState)
  const [searchRequests$] = useState(() => new Subject<SearchRequest | null>())
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

  // Effect event so each search reads the render-current `search` and
  // callbacks without resubscribing the pipeline. Also triggers `onStart`,
  // which the debounced pipeline can't call directly without going stale.
  const runSearch = useEffectEvent((request: SearchRequest) => {
    onStart?.()
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
        () => hasSearchableTerms({allowEmptyQueries, terms: request.terms}),
        // If we have a valid search, run async fetch, map results and trigger `onComplete` / `onError` callbacks
        search(request.terms, request.options).pipe(
          tap(({hits, nextCursor}) => onComplete?.({hits, nextCursor})),
          catchError((error) => {
            onError?.(error)
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
        of({}).pipe(tap(() => onComplete?.({hits: [], nextCursor: undefined}))),
      ),
      // Emit loading completed
      of({loading: false}),
    )
  })

  useEffect(() => {
    const subscription = searchRequests$
      .pipe(
        // Ignore null values
        filter(nonNullable),
        // Sanitize request (trim query and filter)
        map(sanitizeRequest),
        // Only emit when values have changed
        distinctUntilChanged(isEqual),
        // Debounce requests
        debounce((request) => timer(request?.debounceTime || DEFAULT_DEBOUNCE_TIME)),
        switchMap((request) => runSearch(request)),
        scan((prevState, nextState): SearchState => {
          return {...prevState, ...nextState}
        }, INITIAL_SEARCH_STATE),
      )
      .subscribe(setSearchState)

    return () => subscription.unsubscribe()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- runSearch is an effect event; react-hooks/exhaustive-deps forbids listing it
  }, [searchRequests$])

  const handleSearch = useCallback(
    (searchRequest: SearchRequest) => searchRequests$.next(searchRequest),
    [searchRequests$],
  )

  return {handleSearch, searchState}
}
