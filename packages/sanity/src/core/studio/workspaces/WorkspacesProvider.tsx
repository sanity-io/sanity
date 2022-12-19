import React, {useMemo} from 'react'
import {Config, prepareConfig} from '../../config'
import {WorkspacesContext} from './WorkspacesContext'

/** @internal */
export interface WorkspacesProviderProps {
  config: Config
  children: React.ReactNode
  basePath?: string
}

/** @internal */
export function WorkspacesProvider({config, children, basePath}: WorkspacesProviderProps) {
  const {workspaces} = useMemo(() => prepareConfig(config, {basePath}), [config, basePath])
  return <WorkspacesContext.Provider value={workspaces}>{children}</WorkspacesContext.Provider>
}
