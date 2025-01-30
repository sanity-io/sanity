import {useMemo} from 'react'

import {ARCHIVED_RELEASE_STATES} from '../util/const'
import {type ReleaseDocument} from './types'
import {useAllReleases} from './useAllReleases'

/**
 * @internal
 */
export function useArchivedReleases(): {
  data: ReleaseDocument[]
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
