import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {sortReleases} from '../hooks/utils'
import {ARCHIVED_RELEASE_STATES} from '../util/const'
import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {type ReleasesReducerAction} from './reducer'
import {type ReleaseDocument} from './types'
import {useReleasesStore} from './useReleasesStore'

interface ReleasesState {
  /**
   * Sorted array of releases, excluding archived releases
   */
  data: ReleaseDocument[]
  /**
   * Sorted array of release IDs, excluding archived releases
   */
  releasesIds: string[]
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
        Array.from(state.releases.values()).filter(
          (release) => !ARCHIVED_RELEASE_STATES.includes(release.state),
        ),
      ).reverse(),
    [state.releases],
  )

  const releasesIds = useMemo(
    () => releasesAsArray.map((release) => getReleaseIdFromReleaseDocumentId(release._id)),
    [releasesAsArray],
  )
  return {
    data: releasesAsArray,
    releasesIds: releasesIds,
    dispatch,
    error: state.error,
    loading: ['loading', 'initialising'].includes(state.state),
  }
}
