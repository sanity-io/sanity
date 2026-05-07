import {type ComponentType, type ReactNode, useDeferredValue} from 'react'
import {WorkspacesContext} from 'sanity/_singletons'

import {type Config, prepareConfig} from '../../config'
import {type WorkspacesContextValue} from './WorkspacesContext'

/** @internal */
export interface WorkspacesProviderProps {
  config: Config
  children: ReactNode
  basePath?: string
  LoadingComponent: ComponentType
  token?: string
}

/** @internal */
export function WorkspacesProvider({
  config,
  children,
  basePath,
  LoadingComponent,
  token,
}: WorkspacesProviderProps) {
  const workspaces = useDeferredValue(
    prepareConfig(config, {basePath, token}).workspaces satisfies WorkspacesContextValue,
    null,
  )

  if (workspaces === null) {
    return <LoadingComponent />
  }

  return <WorkspacesContext.Provider value={workspaces}>{children}</WorkspacesContext.Provider>
}
