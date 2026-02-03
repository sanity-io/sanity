import {useContext} from 'react'
import {WorkspaceContext} from 'sanity/_singletons'

import {type Workspace} from '../config'

/** @internal */
export interface WorkspaceProviderProps {
  workspace: Workspace
  children: React.ReactNode
}

/** @internal */
export function WorkspaceProvider({
  children,
  workspace,
}: WorkspaceProviderProps): React.JSX.Element {
  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>
}

/**
 * @hidden
 * @beta */
export function useWorkspace(): Workspace {
  const workspace = useContext(WorkspaceContext)

  if (!workspace) throw new Error('Workspace: missing context value')

  return workspace
}
