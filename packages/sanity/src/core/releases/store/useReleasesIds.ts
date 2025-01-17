import {useMemo} from 'react'

import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {type ReleaseDocument} from './types'

/**
 * Gets all the releases ids
 * @internal
 */
export function useReleasesIds(releases: ReleaseDocument[]): {
  releasesIds: string[]
} {
  const releasesIds = useMemo(
    () => releases.map((release) => getReleaseIdFromReleaseDocumentId(release._id)),
    [releases],
  )

  return useMemo(() => ({releasesIds}), [releasesIds])
}
