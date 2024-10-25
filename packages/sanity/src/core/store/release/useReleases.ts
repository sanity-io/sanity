import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useReleasesStore} from '../_legacy/datastores'
import {type ReleasesReducerAction} from './reducer'
import {type ReleaseDocument} from './types'

interface ReleasesState {
  data: ReleaseDocument[]
  // releases: Map<string, ReleaseDocument>
  deletedReleases: Record<string, ReleaseDocument>
  error?: Error
  loading: boolean
  dispatch: React.Dispatch<ReleasesReducerAction>

  /**
   * An array of release ids ordered chronologically to represent the state of documents at the
   * given point in time.
   */
  stack: string[]
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
    // releases: state.releases,
    deletedReleases: deletedReleases,
    dispatch,
    error,
    loading: ['loading', 'initialising'].includes(state.state),
    stack: state.releaseStack,
  }
}
