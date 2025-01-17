import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {sortReleases} from '../hooks/utils'
import {type ReleaseDocument} from './types'
import {useReleasesStore} from './useReleasesStore'

/**
 * Gets all releases including archived and published releases
 * @internal
 */
export function useAllReleases(): {
  data: ReleaseDocument[]
  error?: Error
  loading: boolean
} {
  const {state$} = useReleasesStore()
  const {releases, error, state} = useObservable(state$)!

  return useMemo(
    () => ({
      data: sortReleases(Array.from(releases.values())),
      error: error,
      loading: ['loading', 'initialising'].includes(state),
    }),
    [error, releases, state],
  )
}
