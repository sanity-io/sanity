import {createContext, type ReactChild, useContext} from 'react'

import {type Workspace} from '../config'

/** @internal */
export interface WorkspaceProviderProps {
  workspace: Workspace
  children?: ReactChild
}
const WorkspaceContext = createContext<Workspace | null>(null)

/** @internal */
export function WorkspaceProvider({children, workspace}: WorkspaceProviderProps) {
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
