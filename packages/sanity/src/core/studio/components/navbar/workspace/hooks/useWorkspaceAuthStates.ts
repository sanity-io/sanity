import {merge, of} from 'rxjs'
import {map, scan, startWith} from 'rxjs/operators'

import {type WorkspaceSummary} from '../../../../../config'
import {type AuthState} from '../../../../../store/authStore/types'
import {createHookFromObservableFactory} from '../../../../../util'

export type WorkspaceAuthStates = Record<string, AuthState | undefined>

const EMPTY_AUTH_STATES: WorkspaceAuthStates = {}

export const useWorkspaceAuthStates = createHookFromObservableFactory(
  (workspaces: WorkspaceSummary[]) => {
    if (workspaces.length === 0) return of(EMPTY_AUTH_STATES)
    return merge(
      ...workspaces.map((workspace) =>
        workspace.auth.state.pipe(map((state) => [workspace.name, state] as const)),
      ),
    ).pipe(
      scan<readonly [string, AuthState], WorkspaceAuthStates>(
        (acc, [name, state]) => ({...acc, [name]: state}),
        {},
      ),
      startWith(EMPTY_AUTH_STATES),
    )
  },
  EMPTY_AUTH_STATES,
)
