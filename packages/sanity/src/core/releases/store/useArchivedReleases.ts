import {useMemo} from 'react'

import {type StudioReleaseDocument} from '../types'
import {ARCHIVED_RELEASE_STATES} from '../util/const'
import {useAllReleases} from './useAllReleases'

/**
 * @internal
 */
export function useArchivedReleases(): {
  data: StudioReleaseDocument[]
  error?: Error
  loading: boolean
} {
  const {data: releases, error, loading} = useAllReleases()

  const archivedReleases = useMemo(
    () =>
      Array.from(releases.values()).filter((release) => {
        return ARCHIVED_RELEASE_STATES.includes(release.state)
      }),
    [releases],
  )

  return useMemo(
    () => ({data: archivedReleases, error, loading}),
    [archivedReleases, error, loading],
  )
}
