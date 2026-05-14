import {type ReactNode, useMemo} from 'react'
import {VisibleWorkspacesContext} from 'sanity/_singletons'

import {type WorkspaceSummary} from '../../config/types'
import {
  useWorkspaceAuthStates,
  type WorkspaceAuthStates,
} from '../components/navbar/workspace/hooks'
import {evaluateWorkspaceHidden} from './useVisibleWorkspaces'
import {useWorkspaces} from './useWorkspaces'

/** @internal */
export interface VisibleWorkspacesContextValue {
  visibleWorkspaces: WorkspaceSummary[]
  workspaceAuthStates: WorkspaceAuthStates
}

/** @internal */
export function VisibleWorkspacesProvider({children}: {children: ReactNode}) {
  const allWorkspaces = useWorkspaces()

  // Only subscribe to auth state for workspaces whose visibility depends on
  // the current user. Workspaces with boolean or undefined `hidden` are
  // evaluated synchronously, so we don't need a per-workspace `/users/me`
  // request to decide whether to render them.
  const workspacesNeedingAuth = useMemo(
    () => allWorkspaces.filter((workspace) => typeof workspace.hidden === 'function'),
    [allWorkspaces],
  )

  const [workspaceAuthStates] = useWorkspaceAuthStates(workspacesNeedingAuth)

  const value = useMemo<VisibleWorkspacesContextValue>(
    () => ({
      visibleWorkspaces: allWorkspaces.filter(
        (workspace) => !evaluateWorkspaceHidden(workspace, workspaceAuthStates[workspace.name]),
      ),
      workspaceAuthStates,
    }),
    [allWorkspaces, workspaceAuthStates],
  )

  return (
    <VisibleWorkspacesContext.Provider value={value}>{children}</VisibleWorkspacesContext.Provider>
  )
}
