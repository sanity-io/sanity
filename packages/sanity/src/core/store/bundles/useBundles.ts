import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useBundlesStore} from '../_legacy/datastores'
import {type BundlesReducerAction} from './reducer'
import {type BundleDocument} from './types'

interface BundlesState {
  data: BundleDocument[] | null
  deletedBundles: Record<string, BundleDocument>
  error?: Error
  loading: boolean
  dispatch: React.Dispatch<BundlesReducerAction>
}

/**
 * @internal
 */
export function useBundles(): BundlesState {
  const {state$, dispatch} = useBundlesStore()
  const state = useObservable(state$)!
  const bundlesAsArray = useMemo(() => Array.from(state.bundles.values()), [state.bundles])
  const {deletedBundles, error} = state

  return {
    data: bundlesAsArray,
    deletedBundles,
    dispatch,
    error,
    loading: ['loading', 'initialising'].includes(state.state),
  }
}
