import {useObservable} from 'react-rx'
import {EMPTY} from 'rxjs'

import {type WorkspaceSummary} from '../../../../config/types'

/** @internal */
export type WorkspaceAuthState = 'loading' | 'logged-in' | 'logged-out' | 'no-access' | 'unknown'

/**
 * Whether the user is signed in to `workspace`, from its auth store's `currentUserId`. `unknown`
 * when the store has no such check (a custom auth store).
 *
 * The `null` initial value is load-bearing:
 * - Closed menus keep their items mounted (`<Activity>`, @sanity/ui v4).
 * - Without an initial value, react-rx subscribes during that hidden render, putting the
 *   `/auth/id` requests on the studio boot path.
 * - With it, the first request goes out on reveal (or through the hover/focus preload on the
 *   menu button).
 *
 * @internal
 */
export function useWorkspaceAuthState(workspace: WorkspaceSummary): WorkspaceAuthState {
  const currentUserId$ = workspace.auth.currentUserId
  // `null` until the store answers; `undefined` when signed out.
  const userId = useObservable(currentUserId$ ?? EMPTY, null)
  if (!currentUserId$) return 'unknown'
  if (userId === null) return 'loading'
  if (userId) return 'logged-in'
  return workspace.auth.LoginComponent ? 'logged-out' : 'no-access'
}
