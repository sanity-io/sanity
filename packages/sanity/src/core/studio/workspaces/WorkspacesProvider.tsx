import {type ReactNode, useMemo} from 'react'

import {type Config, prepareConfig} from '../../config'
import {WorkspacesContext} from './WorkspacesContext'

/** @internal */
export interface WorkspacesProviderProps {
  config: Config
  children: ReactNode
  basePath?: string
}

/** @internal */
export function WorkspacesProvider({config, children, basePath}: WorkspacesProviderProps) {
  const {workspaces} = useMemo(() => prepareConfig(config, {basePath}), [config, basePath])
  return <WorkspacesContext.Provider value={workspaces}>{children}</WorkspacesContext.Provider>
}
