import {type ReactNode, useMemo} from 'react'
import {VisibleWorkspacesContext} from 'sanity/_singletons'

import {type WorkspaceSummary} from '../../config/types'
import {useWorkspaceAuthStates} from '../components/navbar/workspace/hooks'
import {evaluateWorkspaceHidden} from './useVisibleWorkspaces'
import {useWorkspaces} from './useWorkspaces'

/** @internal */
export interface VisibleWorkspacesContextValue {
  visibleWorkspaces: WorkspaceSummary[]
  /**
   * `true` while auth state is still resolving for one or more workspaces
   * whose visibility depends on a function-based `hidden` property.
   * `visibleWorkspaces` includes these workspaces optimistically in the
   * meantime.
   *
   * Follows the same fail-open pattern as `evaluateWorkspaceHidden`.
   */
  isResolvingHiddenWorkspaces: boolean
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

  const [authStates] = useWorkspaceAuthStates(workspacesNeedingAuth)

  const value = useMemo<VisibleWorkspacesContextValue>(
    () => ({
      visibleWorkspaces: allWorkspaces.filter(
        (workspace) => !evaluateWorkspaceHidden(workspace, authStates?.[workspace.name]),
      ),
      isResolvingHiddenWorkspaces: workspacesNeedingAuth.length > 0 && authStates === undefined,
    }),
    [allWorkspaces, workspacesNeedingAuth, authStates],
  )

  return (
    <VisibleWorkspacesContext.Provider value={value}>{children}</VisibleWorkspacesContext.Provider>
  )
}
