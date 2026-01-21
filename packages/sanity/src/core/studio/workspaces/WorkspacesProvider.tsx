import {type ComponentType, type ReactNode, useDeferredValue} from 'react'
import {WorkspacesContext} from 'sanity/_singletons'

import type {Config} from '../../config/types'
import {prepareConfig} from '../../config/prepareConfig'
import {type WorkspacesContextValue} from './WorkspacesContext'

/** @internal */
export interface WorkspacesProviderProps {
  config: Config
  children: ReactNode
  basePath?: string
  LoadingComponent: ComponentType
}

/** @internal */
export function WorkspacesProvider({
  config,
  children,
  basePath,
  LoadingComponent,
}: WorkspacesProviderProps) {
  const workspaces = useDeferredValue(
    prepareConfig(config, {basePath}).workspaces satisfies WorkspacesContextValue,
    null,
  )

  if (workspaces === null) {
    return <LoadingComponent />
  }

  return <WorkspacesContext.Provider value={workspaces}>{children}</WorkspacesContext.Provider>
}
