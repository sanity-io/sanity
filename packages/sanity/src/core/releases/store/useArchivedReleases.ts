import {useMemo} from 'react'

import {ARCHIVED_RELEASE_STATES} from '../util/const'
import {type ReleaseDocument} from './types'

/**
 * @internal
 */
export function useArchivedReleases(releases: ReleaseDocument[]): {
  archivedReleases: ReleaseDocument[]
} {
  const archivedReleases = useMemo(
    () =>
      Array.from(releases.values()).filter((release) => {
        return ARCHIVED_RELEASE_STATES.includes(release.state)
      }),
    [releases],
  )

  return useMemo(() => ({archivedReleases}), [archivedReleases])
}
