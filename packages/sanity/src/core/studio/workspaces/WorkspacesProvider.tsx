import {type ReactNode, useMemo} from 'react'
import {WorkspacesContext} from 'sanity/_singletons'

import {type Config, prepareConfig} from '../../config'

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
