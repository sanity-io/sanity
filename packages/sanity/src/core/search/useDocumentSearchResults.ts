import {useEffect, useMemo, useState} from 'react'
import {concat, EMPTY, type Observable, of, Subject, timer} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  mergeMapTo,
  share,
  switchMap,
} from 'rxjs/operators'

import {useClient, useSchema} from '../hooks'
import {useWorkspace} from '../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {isNonNullable} from '../util'
import {getSearchableTypes} from './common/utils'
import {createSearch} from './search'
import {type SearchHit, type WeightedHit} from './weighted/types'

/** @internal */
export interface DocumentSearchParams {
  options: {includeDrafts: boolean; limit: number}
  query: string
}

/** @internal */
export interface DocumentSearchResultsState {
  loading: boolean
  error: Error | null
  value: (WeightedHit | {hit: SearchHit})[]
}

const EMPTY_STATE: DocumentSearchResultsState = {
  loading: false,
  error: null,
  value: [],
}

const LOADING_STATE: DocumentSearchResultsState = {
  loading: true,
  error: null,
  value: [],
}

// This value is used to improve performance by minimizing the number
// of API requests, as well as improving the user experience by waiting
// to display the search results until the user has finished typing.
const DEBOUNCE_VALUE = 400

/** @internal */
// TODO: Is this totally unused? It seems to be.
export function useDocumentSearchResults(props: {
  includeDrafts?: boolean
  limit?: number
  query: string
}): DocumentSearchResultsState {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema()
  const {includeDrafts = false, limit = 1000, query: queryProp} = props
  const [state, setState] = useState<DocumentSearchResultsState>(EMPTY_STATE)
  const paramsSubject = useMemo(() => new Subject<DocumentSearchParams>(), [])
  const strategy = useWorkspace().search.__experimental_strategy

  const search = useMemo(
    () =>
      createSearch(getSearchableTypes(schema), client, {
        strategy,
      }),
    [client, schema, strategy],
  )

  const state$ = useMemo(
    () =>
      paramsSubject.asObservable().pipe(
        share(),
        distinctUntilChanged(),
        filter(isNonNullable),
        switchMap(
          ({query, options}): Observable<DocumentSearchResultsState> =>
            query
              ? concat(
                  of(LOADING_STATE),
                  timer(DEBOUNCE_VALUE).pipe(mergeMapTo(EMPTY)),
                  search(query, options).pipe(
                    map((results) => ({loading: false, error: null, value: results})),
                    catchError((error) => {
                      return of({loading: false, error, value: []})
                    }),
                  ),
                )
              : of(EMPTY_STATE),
        ),
      ),
    [paramsSubject, search],
  )

  useEffect(() => {
    paramsSubject.next({
      options: {includeDrafts, limit},
      query: queryProp,
    })
  }, [includeDrafts, limit, queryProp, paramsSubject])

  useEffect(() => {
    const sub = state$.subscribe(setState)

    return () => {
      sub.unsubscribe()
    }
  }, [state$])

  return state
}
