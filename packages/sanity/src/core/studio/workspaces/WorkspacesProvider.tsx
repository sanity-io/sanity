import React, {useMemo} from 'react'
import {Config, prepareConfig} from '../../config'
import {WorkspacesContext} from './WorkspacesContext'

/** @internal */
export interface WorkspacesProviderProps {
  config: Config
  children: React.ReactNode
}

/** @internal */
export function WorkspacesProvider({config, children}: WorkspacesProviderProps) {
  const {workspaces} = useMemo(() => prepareConfig(config), [config])
  return <WorkspacesContext.Provider value={workspaces}>{children}</WorkspacesContext.Provider>
}
