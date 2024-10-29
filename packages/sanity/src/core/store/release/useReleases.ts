import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {getBundleIdFromReleaseId} from 'sanity'

import {sortReleases} from '../../releases/hooks/utils'
import {useReleasesStore} from '../_legacy/datastores'
import {type ReleasesReducerAction} from './reducer'
import {type ReleaseDocument} from './types'

interface ReleasesState {
  /**
   * Sorted array of releases, excluding archived releases
   */
  data: ReleaseDocument[]
  /**
   * Sorted array of release IDs, excluding archived releases
   */
  releasesIds: string[]
  /**
   * Array of archived releases
   */
  archivedReleases: ReleaseDocument[]
  error?: Error
  loading: boolean
  dispatch: (event: ReleasesReducerAction) => void
}

/**
 * @internal
 */
export function useReleases(): ReleasesState {
  const {state$, dispatch} = useReleasesStore()
  const state = useObservable(state$)!
  const releasesAsArray = useMemo(
    () =>
      sortReleases(
        Array.from(state.releases.values()).filter((release) => release.state !== 'archived'),
      ).reverse(),
    [state.releases],
  )
  const archivedReleases = useMemo(
    () => Array.from(state.releases.values()).filter((release) => release.state === 'archived'),
    [state.releases],
  )
  const releasesIds = useMemo(
    () => releasesAsArray.map((release) => getBundleIdFromReleaseId(release._id)),
    [releasesAsArray],
  )
  return {
    data: releasesAsArray,
    releasesIds: releasesIds,
    archivedReleases,
    dispatch,
    error: state.error,
    loading: ['loading', 'initialising'].includes(state.state),
  }
}
