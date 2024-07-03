import {type ListenEvent} from '@sanity/client'
import {useCallback, useMemo, useReducer, useRef, useState} from 'react'
import {useObservable} from 'react-rx'
import {catchError, concatMap, map, of, retry, share, timeout} from 'rxjs'
import {useBundlesStore} from 'sanity'

import {bundlesReducer, type bundlesReducerAction, type bundlesReducerState} from './reducer'
import {type BundleDocument} from './types'

interface BundlesStore {
  data: BundleDocument[] | null
  error: Error | null
  loading: boolean
  dispatch: React.Dispatch<bundlesReducerAction>
}

const INITIAL_STATE: bundlesReducerState = {
  bundles: new Map(),
}

export function useBundles(): BundlesStore {
  const [state, dispatch] = useReducer(bundlesReducer, INITIAL_STATE)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const didInitialFetch = useRef<boolean>(false)
  const {initialFetch, listener} = useBundlesStore()
  const initialFetch$ = useCallback(() => {
    return initialFetch().pipe(
      share(),
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
  }, [initialFetch])

  const handleListenerEvent = useCallback(
    (event: ListenEvent<Record<string, BundleDocument | null>>) => {
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
    const events$ = listener().pipe(
      share(),
      map(handleListenerEvent),
      catchError((err) => {
        setError(err)
        return of(err)
      }),
    )

    return events$ // as Observable<ListenEvent<Record<string, BundleDocument>>>
  }, [handleListenerEvent, listener])

  const observable = useMemo(() => {
    return initialFetch$().pipe(concatMap(() => listener$))
  }, [initialFetch$, listener$])

  useObservable(observable)

  const bundlesAsArray = useMemo(() => Array.from(state.bundles.values()), [state.bundles])
  console.log('bundlesAsArray', bundlesAsArray)
  return {
    data: bundlesAsArray,
    dispatch,
    error,
    loading,
  }
}
