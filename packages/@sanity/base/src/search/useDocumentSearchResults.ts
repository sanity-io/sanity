import {useEffect, useMemo, useState} from 'react'
import {merge, Observable, of, Subject} from 'rxjs'
import {catchError, debounceTime, map, share, switchMap} from 'rxjs/operators'
import {useSource} from '../source'
import {createSearch} from './search'
import {WeightedHit} from './weighted/types'

export interface DocumentSearchParams {
  options: {includeDrafts: boolean; limit: number}
  query: string
}

export interface DocumentSearchResultsState {
  loading: boolean
  error: Error | null
  value: WeightedHit[]
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

export function useDocumentSearchResults(props: {
  includeDrafts?: boolean
  limit?: number
  query: string
}): DocumentSearchResultsState {
  const {client, schema} = useSource()
  const {includeDrafts = false, limit = 1000, query: queryProp} = props
  const [state, setState] = useState<DocumentSearchResultsState>(EMPTY_STATE)
  const paramsSubject = useMemo(() => new Subject<DocumentSearchParams>(), [])

  const search = useMemo(() => createSearch(client, schema), [client, schema])

  const state$ = useMemo(
    () =>
      paramsSubject.asObservable().pipe(
        share(),
        debounceTime(100),
        switchMap(
          ({query, options}): Observable<DocumentSearchResultsState> =>
            query
              ? merge(
                  of(LOADING_STATE),
                  search(query, options).pipe(
                    map((results) => ({
                      loading: false,
                      error: null,
                      value: results,
                    })),
                    catchError((error) =>
                      of({
                        loading: false,
                        error,
                        value: [],
                      })
                    )
                  )
                )
              : of(EMPTY_STATE)
        )
      ),
    [paramsSubject, search]
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
