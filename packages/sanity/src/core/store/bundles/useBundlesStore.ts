import {type ListenEvent, type ListenOptions} from '@sanity/client'
import {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react'
import {catchError, of} from 'rxjs'

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
  const [loading, setLoading] = useState<boolean>(client !== null)
  const [error, setError] = useState<Error | null>(null)

  const didInitialFetch = useRef<boolean>(false)

  const initialFetch = useCallback(async () => {
    if (!client) {
      setLoading(false)
      return
    }

    try {
      const res = await client.fetch(QUERY)
      dispatch({type: 'BUNDLES_SET', bundles: res})
      setLoading(false)
    } catch (err) {
      setError(err)
    }
  }, [client])

  const handleListenerEvent = useCallback(
    async (event: ListenEvent<Record<string, BundleDocument>>) => {
      // Fetch all bundles on initial connection
      if (event.type === 'welcome' && !didInitialFetch.current) {
        setLoading(true)
        await initialFetch()
        setLoading(false)
        didInitialFetch.current = true
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
      if (event.type === 'mutation') {
        if (event.transition === 'appear') {
          const nextBundle = event.result as BundleDocument | undefined

          if (nextBundle) {
            dispatch({
              type: 'BUNDLE_RECEIVED',
              payload: nextBundle,
            })
          }
        }

        if (event.transition === 'disappear') {
          dispatch({type: 'BUNDLE_DELETED', id: event.documentId})
        }

        if (event.transition === 'update') {
          const updatedBundle = event.result as BundleDocument | undefined

          if (updatedBundle) {
            dispatch({
              type: 'BUNDLE_UPDATED',
              payload: updatedBundle,
            })
          }
        }
      }
    },
    [initialFetch],
  )

  const listener$ = useMemo(() => {
    if (!client) return of()

    const events$ = client.observable.listen(QUERY, {}, LISTEN_OPTIONS).pipe(
      catchError((err) => {
        setError(err)
        return of(err)
      }),
    )

    return events$
  }, [client])

  useEffect(() => {
    const sub = listener$.subscribe(handleListenerEvent)

    return () => {
      sub?.unsubscribe()
    }
  }, [handleListenerEvent, listener$])

  // Transform bundles object to array
  const bundlesAsArray = useMemo(() => Array.from(state.bundles.values()), [state.bundles])

  return {
    data: bundlesAsArray,
    dispatch,
    error,
    loading,
  }
}
