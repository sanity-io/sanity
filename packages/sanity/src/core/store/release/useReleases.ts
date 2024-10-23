import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useReleasesStore} from '../_legacy/datastores'
import {type ReleasesReducerAction} from './reducer'
import {type ReleaseDocument} from './types'

interface ReleasesState {
  data: ReleaseDocument[]
  deletedReleases: Record<string, ReleaseDocument>
  error?: Error
  loading: boolean
  dispatch: React.Dispatch<ReleasesReducerAction>
}

/**
 * @internal
 */
export function useReleases(): ReleasesState {
  const {state$, dispatch} = useReleasesStore()
  const state = useObservable(state$)!
  const releasesAsArray = useMemo(() => Array.from(state.releases.values()), [state.releases])
  const {deletedReleases, error} = state

  return {
    data: releasesAsArray,
    deletedReleases: deletedReleases,
    dispatch,
    error,
    loading: ['loading', 'initialising'].includes(state.state),
  }
}
