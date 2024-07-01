import {type ListenEvent, type ListenOptions} from '@sanity/client'
import {useCallback, useMemo, useReducer, useRef, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, concatMap, map, of, retry, timeout} from 'rxjs'

import {useAddonDataset} from '../../studio/addonDataset/useAddonDataset'
import {bundlesReducer, type bundlesReducerAction, type bundlesReducerState} from './reducer'
import {type BundleDocument} from './types'

interface BundlesStoreReturnType {
  data: BundleDocument[] | null
  error: Error | null
  loading: boolean
  dispatch: React.Dispatch<bundlesReducerAction>
}

const INITIAL_STATE: bundlesReducerState = {
  bundles: new Map(),
}

const LISTEN_OPTIONS: ListenOptions = {
  events: ['welcome', 'mutation', 'reconnect'],
  includeResult: true,
  visibility: 'query',
}

export const SORT_FIELD = '_createdAt'
export const SORT_ORDER = 'desc'

const QUERY_FILTERS = [`_type == "bundle"`]

// TODO: Extend the projection with the fields needed
const QUERY_PROJECTION = `{
  ...,
}`

// Newest bundles first
const QUERY_SORT_ORDER = `order(${SORT_FIELD} ${SORT_ORDER})`

const QUERY = `*[${QUERY_FILTERS.join(' && ')}] ${QUERY_PROJECTION} | ${QUERY_SORT_ORDER}`

export function useBundlesStore(): BundlesStoreReturnType {
  const {client} = useAddonDataset()

  const [state, dispatch] = useReducer(bundlesReducer, INITIAL_STATE)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const didInitialFetch = useRef<boolean>(false)

  const initialFetch$ = useCallback(() => {
    if (!client) {
      return of(null) // emits null and completes if no client
    }
    return client.observable.fetch(QUERY).pipe(
      timeout(10000), // 10s timeout
      map((res) => {
        dispatch({type: 'BUNDLES_SET', payload: res})
        didInitialFetch.current = true
        setLoading(false)
      }),
      retry({
        count: 2,
        delay: 1000,
      }),
      catchError((err) => {
        if (err.name === 'TimeoutError') {
          console.error('Fetch operation timed out:', err)
        }
        setError(err)
        return of(null) // ensure stream completion even on error
      }),
    )
  }, [client])

  const handleListenerEvent = useCallback(
    (event: ListenEvent<Record<string, BundleDocument>>) => {
      // Fetch all bundles on initial connection
      if (event.type === 'welcome' && !didInitialFetch.current) {
        // Do nothing here, the initial fetch is done in the useEffect below
        initialFetch$()
      }

      // The reconnect event means that we are trying to reconnect to the realtime listener.
      // In this case we set loading to true to indicate that we're trying to
      // reconnect. Once a connection has been established, the welcome event
      // will be received and we'll fetch all bundles again (above)
      if (event.type === 'reconnect') {
        setLoading(true)
        didInitialFetch.current = false
      }

      // Handle mutations (create, update, delete) from the realtime listener
      // and update the bundles store accordingly
      if (event.type === 'mutation' && didInitialFetch.current) {
        if (event.transition === 'disappear') {
          dispatch({type: 'BUNDLE_DELETED', id: event.documentId})
        }

        if (event.transition === 'appear') {
          const nextBundle = event.result as BundleDocument | undefined

          if (nextBundle) {
            dispatch({type: 'BUNDLE_RECEIVED', payload: nextBundle})
          }
        }

        if (event.transition === 'update') {
          const updatedBundle = event.result as BundleDocument | undefined

          if (updatedBundle) {
            dispatch({type: 'BUNDLE_UPDATED', payload: updatedBundle})
          }
        }
      }
    },
    [initialFetch$],
  )

  const listener$ = useMemo(() => {
    if (!client) return of()

    const events$ = client.observable.listen(QUERY, {}, LISTEN_OPTIONS).pipe(
      map(handleListenerEvent),
      catchError((err) => {
        setError(err)
        return of(err)
      }),
    )

    return events$ // as Observable<ListenEvent<Record<string, BundleDocument>>>
  }, [client, handleListenerEvent])

  const observable = useMemo(() => {
    if (!client) return of(null) // emits null and completes if no client
    return initialFetch$().pipe(concatMap(() => listener$))
  }, [initialFetch$, listener$, client])

  useObservable(observable)

  const bundlesAsArray = useMemo(() => Array.from(state.bundles.values()), [state.bundles])

  return {
    data: bundlesAsArray,
    dispatch,
    error,
    loading,
  }
}
