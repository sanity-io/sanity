import {type ReleaseDocument} from '@sanity/client'

import {sortReleases} from '../releases/hooks/utils'
import {type ReleaseOrderOptions, type VersionStub} from './types'

/**
 * The one version order every surface uses: Published, then Drafts, then releases in the order
 * they go out (ASAP, then scheduled by date, then undecided), then agent bundles. A release that
 * has not loaded sits after the known releases.
 *
 * `sortReleases` orders the perspective stack, which reads from the furthest release to the
 * nearest, so its order is reversed here.
 *
 * With `scheduledDrafts: 'afterReleases'`, scheduled drafts (single-document releases) move after
 * every other release instead of sitting among the scheduled releases by date.
 *
 * @internal
 */
export function createVersionRanker(
  releases: Map<string, ReleaseDocument>,
  {scheduledDrafts = 'byDate'}: ReleaseOrderOptions = {},
): (stub: Pick<VersionStub, 'kind' | 'bundle'>) => number {
  const byDate = sortReleases([...releases.values()]).toReversed()
  const releaseOrder =
    scheduledDrafts === 'afterReleases'
      ? [
          ...byDate.filter((release) => release.metadata.cardinality !== 'one'),
          ...byDate.filter((release) => release.metadata.cardinality === 'one'),
        ]
      : byDate
  const releaseRanks = new Map(releaseOrder.map((release, index) => [release._id, index]))
  const unknownRelease = releaseOrder.length

  return (stub) => {
    switch (stub.kind) {
      case 'published':
        return 0
      case 'draft':
        return 1
      case 'release':
        return 2 + (releaseRanks.get(stub.bundle) ?? unknownRelease)
      case 'agent':
      default:
        return 3 + unknownRelease
    }
  }
}
