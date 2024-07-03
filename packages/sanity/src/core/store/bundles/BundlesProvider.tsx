import {type Dispatch, useContext, useMemo} from 'react'
import {BundlesContext} from 'sanity/_singletons'

import {type bundlesReducerAction} from './reducer'
import {type BundleDocument} from './types'
import {useBundlesStore} from './useBundlesStore'

interface BundlesProviderProps {
  children: React.ReactNode
}

const EMPTY_ARRAY: [] = []

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

export function useBundles(): BundlesContextValue {
  const context = useContext(BundlesContext)
  if (!context) {
    throw new Error('useBundles must be used within a BundlesProvider')
  }
  return context
}
