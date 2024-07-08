import {type Dispatch, useContext, useMemo} from 'react'
import {BundlesContext} from 'sanity/_singletons'

import {type bundlesReducerAction} from './reducer'
import {type BundleDocument} from './types'
import {useBundlesStore} from './useBundlesStore'

interface BundlesProviderProps {
  children: React.ReactNode
}

const EMPTY_ARRAY: [] = []

/**
 * @internal
 */
export type BundlesContextValue = {
  dispatch: Dispatch<bundlesReducerAction>
  loading: boolean
  data: BundleDocument[]
  error: Error | null
}

/**
 * @internal
 */
export function BundlesProvider(props: BundlesProviderProps) {
  const {children} = props
  const {data = EMPTY_ARRAY, loading, dispatch, error} = useBundlesStore()

  const value = useMemo(
    () => ({
      dispatch,
      loading,
      data: data ?? [],
      error,
    }),
    [data, dispatch, loading, error],
  )

  return <BundlesContext.Provider value={value}>{children}</BundlesContext.Provider>
}

/**
 * @internal
 */
export function useBundles(): BundlesContextValue {
  const context = useContext(BundlesContext)
  if (!context) {
    // TODO: Re consider this, the provider is added when the plugin is inserted
    // if users opt out, they won't get the provider, but this return will be called in some core components.
    return {
      dispatch: () => {},
      loading: false,
      data: [],
      error: null,
    }
  }
  return context
}
