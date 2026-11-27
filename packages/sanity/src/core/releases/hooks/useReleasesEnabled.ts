import {useReleasesToolAvailable} from '../../schedules/hooks/useReleasesToolAvailable'
import {useWorkspace} from '../../studio/workspace'

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
