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
  const [authStates] = useWorkspaceAuthStates(allWorkspaces)

  const value = useMemo(
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
