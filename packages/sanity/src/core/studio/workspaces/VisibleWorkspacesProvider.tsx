import {type ReactNode, useMemo} from 'react'
import {VisibleWorkspacesContext} from 'sanity/_singletons'

import {type WorkspaceSummary} from '../../config/types'
import {type AuthState} from '../../store/_legacy/authStore/types'
import {useWorkspaceAuthStates} from '../components/navbar/workspace/hooks'
import {evaluateWorkspaceHidden} from './useVisibleWorkspaces'
import {useWorkspaces} from './useWorkspaces'

/** @internal */
export interface VisibleWorkspacesContextValue {
  visibleWorkspaces: WorkspaceSummary[]
  authStates: Record<string, AuthState> | undefined
}

/** @internal */
export function VisibleWorkspacesProvider({children}: {children: ReactNode}) {
  const allWorkspaces = useWorkspaces()

  // Only subscribe to auth state for workspaces whose visibility depends on
  // the current user. Workspaces with boolean or undefined `hidden` are
  // evaluated synchronously, so we don't need a per-workspace `/users/me`
  // request to decide whether to render them. This avoids a thundering herd
  // of auth requests at studio boot (which was measurably increasing p99
  // `load`-event times in Firefox and causing `page.goto` to time out in
  // e2e tests).
  const workspacesNeedingAuth = useMemo(
    () => allWorkspaces.filter((workspace) => typeof workspace.hidden === 'function'),
    [allWorkspaces],
  )

  const [authStates] = useWorkspaceAuthStates(workspacesNeedingAuth)

  const value = useMemo<VisibleWorkspacesContextValue>(
    () => ({
      visibleWorkspaces: allWorkspaces.filter(
        (workspace) => !evaluateWorkspaceHidden(workspace, authStates?.[workspace.name]),
      ),
      authStates,
    }),
    [allWorkspaces, authStates],
  )

  return (
    <VisibleWorkspacesContext.Provider value={value}>{children}</VisibleWorkspacesContext.Provider>
  )
}
