import {useWorkspace} from '../../studio/workspace'
import {useActiveReleases} from '../store/useActiveReleases'

interface WorkspaceReleaseLimit {
  limit: number
  isLimitReached: boolean
}

/**
 * Checks the workspace `releases.limit` against every active release in the dataset.
 * @internal
 */
export function useWorkspaceReleaseLimit(): WorkspaceReleaseLimit {
  const {releases} = useWorkspace()
  const {data: activeReleases} = useActiveReleases()
  const limit = releases?.limit ?? Infinity

  return {limit, isLimitReached: activeReleases.length >= limit}
}
