import React, {useMemo} from 'react'
import {Config, prepareConfig} from '../../config'
import {WorkspacesContext} from './WorkspacesContext'

interface WorkspaceProviderProps {
  config: Config
  children: React.ReactNode
}

export function WorkspacesProvider({config, children}: WorkspaceProviderProps) {
  const {workspaces} = useMemo(() => prepareConfig(config), [config])
  return <WorkspacesContext.Provider value={workspaces}>{children}</WorkspacesContext.Provider>
}
