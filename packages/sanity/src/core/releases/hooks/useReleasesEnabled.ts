import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'

import {useReleasesToolAvailable} from '../../schedules/hooks/useReleasesToolAvailable'
import {useWorkspace} from '../../studio/workspace'
import {isCardinalityOneRelease} from '../../util/releaseUtils'

/**
 * Whether content releases are on in this workspace.
 *
 * `useReleasesToolAvailable` alone isn't enough: the schedules tool is also mounted when only
 * scheduled drafts are on (`releases.enabled: false`, `scheduledDrafts.enabled: true`), so it
 * returns true in a workspace with releases off. This is the same check the navbar uses.
 *
 * @internal
 */
export function useReleasesEnabled(): boolean {
  const releasesToolAvailable = useReleasesToolAvailable()
  const {releases} = useWorkspace()
  return releasesToolAvailable && Boolean(releases?.enabled)
}

/**
 * The releases a surface may offer or show. With releases off, only scheduled drafts
 * (cardinality-one releases) are kept: they belong to the scheduled drafts feature, not to releases.
 *
 * @internal
 */
export function filterReleasesForWorkspace<T extends ReleaseDocument>(
  releases: T[],
  releasesEnabled: boolean,
): T[] {
  return releasesEnabled ? releases : releases.filter((release) => isCardinalityOneRelease(release))
}

/**
 * {@link filterReleasesForWorkspace} with this workspace's setting, memoised on the input array.
 *
 * @internal
 */
export function useWorkspaceReleases<T extends ReleaseDocument>(releases: T[]): T[] {
  const releasesEnabled = useReleasesEnabled()
  return useMemo(
    () => filterReleasesForWorkspace(releases, releasesEnabled),
    [releases, releasesEnabled],
  )
}
