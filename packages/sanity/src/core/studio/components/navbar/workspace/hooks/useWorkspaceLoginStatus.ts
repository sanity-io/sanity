import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {type WorkspaceSummary} from '../../../../../config/types'
import {probeWorkspaceAuth} from '../../../../../store/auth/legacy/probeWorkspaceAuth'

/** @internal */
export type WorkspaceLoginStatus = 'loading' | 'logged-in' | 'logged-out' | 'no-access'

/**
 * Whether the user is signed in to `workspace`, from a `/auth/id` probe of its project.
 *
 * Only for the workspace menu and the login screen. Not to be confused with
 * `useWorkspaceAuthStates`, which subscribes to each store's full `state` to decide which
 * workspaces are visible.
 *
 * The `null` initial value is load-bearing:
 * - Closed menus keep their items mounted (`<Activity>`, @sanity/ui v4).
 * - Without an initial value, react-rx subscribes during that hidden
 *   render — putting the `/auth/id` probes on the studio boot path.
 * - With it, the probe first fires on reveal (or via the hover/focus
 *   preload on the menu button).
 *
 * @internal
 */
export function useWorkspaceLoginStatus(workspace: WorkspaceSummary): WorkspaceLoginStatus {
  const probe$ = useMemo(
    () =>
      probeWorkspaceAuth({
        projectId: workspace.projectId,
        dataset: workspace.dataset,
        apiHost: workspace.apiHost,
      }),
    [workspace.apiHost, workspace.dataset, workspace.projectId],
  )
  const probe = useObservable(probe$, null)

  if (!probe) return 'loading'
  if (probe.authenticated) return 'logged-in'
  return workspace.auth.LoginComponent ? 'logged-out' : 'no-access'
}
