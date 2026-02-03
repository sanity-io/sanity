import {getReleaseIdFromReleaseDocumentId} from '../util/getReleaseIdFromReleaseDocumentId'
import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'

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
