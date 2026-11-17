import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'

import {getPublishedId} from '../../util/draftUtils'
import {useReleasesMetadataProvider} from '../contexts/ReleasesMetadataProvider'
import {useActiveReleases} from '../store/useActiveReleases'
import {type ReleasesMetadata, useReleasesMetadata} from '../store/useReleasesMetadata'
import {findSharedGroups} from './releaseImpact'

/**
 * The member group ids of each release, keyed by release document id.
 *
 * Today's adapter: a release's members are the versions in its bundle, and the releases metadata
 * aggregator already lists them for every release it watches. A pointer-based release reads its
 * membership instead and returns the same map, so nothing downstream changes.
 *
 * Releases whose metadata has not arrived are left out, so they never count as sharing.
 *
 * @internal
 */
export function getMemberGroupIdsByRelease(
  releaseIds: ReadonlyArray<string>,
  metadata: Record<string, ReleasesMetadata | undefined> | null,
): Map<string, string[]> {
  const groupIdsByRelease = new Map<string, string[]>()
  if (!metadata) return groupIdsByRelease
  for (const releaseId of releaseIds) {
    const documentIds = metadata[releaseId]?.documentIds
    if (documentIds) groupIdsByRelease.set(releaseId, documentIds.map(getPublishedId))
  }
  return groupIdsByRelease
}

/**
 * How many of a release's document groups are also in another release.
 *
 * @internal
 */
export function countSharedGroups(
  sharedGroups: ReadonlyMap<string, ReadonlyArray<string>>,
  releaseId: string,
): number {
  let count = 0
  for (const releaseIds of sharedGroups.values()) {
    if (releaseIds.includes(releaseId)) count++
  }
  return count
}

/**
 * The other releases a document group is in, in the order of `releasesById`.
 *
 * @internal
 */
export function getOtherReleases(
  sharedGroups: ReadonlyMap<string, ReadonlyArray<string>>,
  releasesById: ReadonlyMap<string, ReleaseDocument>,
  groupId: string,
  releaseId: string,
): ReleaseDocument[] {
  const releaseIds = sharedGroups.get(groupId)
  if (!releaseIds) return []
  const others: ReleaseDocument[] = []
  for (const [id, release] of releasesById) {
    if (id !== releaseId && releaseIds.includes(id)) others.push(release)
  }
  return others
}

/** @internal */
export interface SharedReleaseGroups {
  /** Group id to the ids of the active releases that contain it. Only groups in two or more. */
  sharedGroups: Map<string, string[]>
  /** The active releases, scheduled drafts included, keyed by release document id. */
  releasesById: Map<string, ReleaseDocument>
  /** True until membership has arrived for the active releases. */
  loading: boolean
}

/**
 * The document groups that more than one active release contains. Archived and published releases
 * never count; scheduled drafts do.
 *
 * Data: no request of its own. It asks the shared releases metadata aggregator for every active
 * release, which fetches all their member ids in one query and keeps them current with one
 * listener. The overview already asks for most of these releases, so there it costs nothing extra.
 *
 * @internal
 */
export function useSharedReleaseGroups(): SharedReleaseGroups {
  const {data: activeReleases, byId: releasesById, loading: releasesLoading} = useActiveReleases()
  // Stable for a stable set of releases: `useReleasesMetadata` registers it with the shared
  // listener in an effect keyed on this array.
  const releaseIds = useMemo(() => activeReleases.map((release) => release._id), [activeReleases])
  // Registers the releases with the shared listener. The data is read from the provider instead,
  // whose object only changes when a fetch lands; the hook's copy is rebuilt on every render.
  const {loading: metadataLoading} = useReleasesMetadata(releaseIds)
  const metadata = useReleasesMetadataProvider().state.data

  const sharedGroups = useMemo(
    () => findSharedGroups(getMemberGroupIdsByRelease(releaseIds, metadata)),
    [releaseIds, metadata],
  )

  return useMemo(
    () => ({
      sharedGroups,
      releasesById,
      loading: releasesLoading || (metadataLoading && !metadata),
    }),
    [sharedGroups, releasesById, releasesLoading, metadataLoading, metadata],
  )
}
