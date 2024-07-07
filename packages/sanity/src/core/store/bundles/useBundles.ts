import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {useBundlesStore} from 'sanity'

import {type bundlesReducerAction} from './reducer'
import {type BundleDocument} from './types'

interface BundlesStore {
  data: BundleDocument[]
  error?: Error
  loading: boolean
  dispatch: React.Dispatch<bundlesReducerAction>
}

export function useBundles(): BundlesStore {
  const {state$, dispatch} = useBundlesStore()
  const state = useObservable(state$)!
  const bundlesAsArray = useMemo(() => Array.from(state.bundles.values()), [state.bundles])

  return {
    data: bundlesAsArray,
    dispatch,
    error: state.error,
    loading: ['loading', 'initialising'].includes(state.state),
  }
}
