import React, {createContext, useContext} from 'react'
import {Workspace} from '../config'

export interface WorkspaceProviderProps {
  workspace: Workspace
  children?: React.ReactChild
}
const WorkspaceContext = createContext<Workspace | null>(null)
export function WorkspaceProvider({children, workspace}: WorkspaceProviderProps) {
  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>
}
export function useWorkspace() {
  const workspace = useContext(WorkspaceContext)
  if (!workspace) throw new Error('Could not find `workspace` context')
  return workspace
}
