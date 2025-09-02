import {type ComponentType, type ReactNode, useDeferredValue, useMemo} from 'react'
import {WorkspacesContext} from 'sanity/_singletons'

import {type Config, prepareConfig} from '../../config'

/** @internal */
export interface WorkspacesProviderProps {
  config: Config
  children: ReactNode
  basePath?: string
  LoadingComponent: ComponentType
}

/** @internal */
export function WorkspacesProvider({
  config: _config,
  children,
  basePath,
  LoadingComponent,
}: WorkspacesProviderProps) {
  // Wait with resolving the config, as prepareConfig is expensive, until the first render is done, this is accomplished by using the second arg of `useDeferredValue`
  const config = useDeferredValue(_config, null)
  const workspaces = useMemo(
    () => (config ? prepareConfig(config, {basePath}).workspaces : null),
    [config, basePath],
  )

  if (workspaces === null) {
    return <LoadingComponent />
  }

  return <WorkspacesContext.Provider value={workspaces}>{children}</WorkspacesContext.Provider>
}
