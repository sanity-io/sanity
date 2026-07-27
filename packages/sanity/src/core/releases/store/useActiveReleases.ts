import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {EMPTY_ARRAY} from '../../util/empty'
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
  const {state$, sortedReleases$, dispatch} = useReleasesStore()
  const state = useObservable(state$)!
  const data = useObservable(sortedReleases$, EMPTY_ARRAY)

  return useMemo(
    () => ({
      data,
      dispatch,
      error: state.error,
      loading: ['loading', 'initialising'].includes(state.state),
    }),
    [data, state.error, state.state, dispatch],
  )
}
