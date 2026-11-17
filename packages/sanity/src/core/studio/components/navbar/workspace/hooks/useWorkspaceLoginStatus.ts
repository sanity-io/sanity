import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {EMPTY, type Observable} from 'rxjs'
import {map} from 'rxjs/operators'

import {type WorkspaceSummary} from '../../../../../config/types'

/** @internal */
export type WorkspaceLoginStatus = 'loading' | 'logged-in' | 'logged-out' | 'unknown'

/**
 * Whether the user is signed in to `workspace`, from its auth store's `currentUserId`. `unknown`
 * when the store has no such check (a custom auth store).
 *
 * Only for the workspace menu and the login screen. Not to be confused with
 * `useWorkspaceAuthStates`, which subscribes to each store's full `state` to decide which
 * workspaces are visible.
 *
 * It is `loading` until the store answers. No request goes out while the workspace menu is
 * closed: a closed menu keeps its items mounted in a hidden `<Activity>`, and react-rx subscribes
 * only once that is shown, or when the menu button's hover or focus preload subscribes.
 *
 * @internal
 */
export function useWorkspaceLoginStatus(
  workspace: Pick<WorkspaceSummary, 'auth'>,
): WorkspaceLoginStatus {
  const currentUserId$ = workspace.auth.currentUserId
  const status$ = useMemo(
    (): Observable<WorkspaceLoginStatus> =>
      (currentUserId$ ?? EMPTY).pipe(map((userId) => (userId ? 'logged-in' : 'logged-out'))),
    [currentUserId$],
  )
  const status = useObservable(status$, 'loading')
  return currentUserId$ ? status : 'unknown'
}
