import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {sortReleases} from '../hooks/utils'
import {ARCHIVED_RELEASE_STATES} from '../util/const'
import {type ReleasesReducerAction} from './reducer'
import {type ReleaseDocument} from './types'
import {useReleasesStore} from './useReleasesStore'

interface ReleasesState {
  /**
   * Sorted array of releases, excluding archived releases
   */
  data: ReleaseDocument[]
  error?: Error
  loading: boolean
  dispatch: (event: ReleasesReducerAction) => void
}

/**
 * Hook to get the (non archived, non published) active releases
 * @internal
 */
export function useActiveReleases(): ReleasesState {
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

  return useMemo(
    () => ({
      data: releasesAsArray,
      dispatch,
      error: state.error,
      loading: ['loading', 'initialising'].includes(state.state),
    }),
    [releasesAsArray, state.error, state.state, dispatch],
  )
}
