import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable as useSyncObservable} from 'react-rx'

import {sortReleases} from '../hooks/utils'
import {ARCHIVED_RELEASE_STATES} from '../util/const'
import {type ReleasesReducerAction} from './reducer'
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
  // Kept synchronous: PerspectiveProvider derives `selectedReleaseId` from
  // this list while `selectedPerspectiveName` stays live, so a deferred
  // snapshot could tear the release identity (e.g. reference create-in-place
  // writing `_weak` or opening the wrong version). Executable proof:
  // perspective/__tests__/deferralSafety.test.tsx.
  const state = useSyncObservable(state$)!
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
