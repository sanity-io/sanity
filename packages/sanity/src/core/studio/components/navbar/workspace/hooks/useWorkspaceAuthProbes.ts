import {combineLatest, NEVER, of} from 'rxjs'
import {map} from 'rxjs/operators'

import {type WorkspaceSummary} from '../../../../../config'
import {
  probeWorkspaceAuth,
  type WorkspaceAuthProbeResult,
} from '../../../../../store/authStore/probeWorkspaceAuth'
import {createHookFromObservableFactory} from '../../../../../util'

interface UseWorkspaceAuthProbesArg {
  workspaces: WorkspaceSummary[]
  /**
   * When `false`, the hook stays in its loading state and never subscribes
   * to any probe. Use this to defer the per-workspace `/auth/id` fan-out
   * until a UI surface (e.g. a popover menu) actually mounts or opens.
   * Defaults to `true`.
   */
  enabled?: boolean
}

/**
 * Returns `{[workspaceName]: {authenticated}}` for the given workspaces, using
 * the lightweight `/auth/id` probe ({@link probeWorkspaceAuth}) instead of the
 * full per-workspace `AuthStore`.
 *
 * Use this when a callsite only needs to know whether the user is logged in
 * to a workspace's project — not who they are. Probes are deduped by
 * `(apiHost, projectId, token)`, so workspaces in the same project share a
 * single underlying request.
 *
 * @internal
 */
export const useWorkspaceAuthProbes = createHookFromObservableFactory(
  ({workspaces, enabled = true}: UseWorkspaceAuthProbesArg) => {
    if (!enabled) return NEVER
    if (workspaces.length === 0) {
      return of({} as Record<string, WorkspaceAuthProbeResult>)
    }
    return combineLatest(
      workspaces.map((workspace) =>
        probeWorkspaceAuth({
          projectId: workspace.projectId,
          dataset: workspace.dataset,
          apiHost: workspace.apiHost,
        }).pipe(map((result) => [workspace.name, result] as const)),
      ),
    ).pipe(map((entries) => Object.fromEntries(entries)))
  },
)
