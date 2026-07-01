import {SDKStudioContext} from '@sanity/sdk-react'
import {useContext} from 'react'
import {WorkspaceContext} from 'sanity/_singletons'

import {type Workspace} from '../config'

/** @internal */
export interface WorkspaceProviderProps {
  workspace: Workspace
  children: React.ReactNode
}

/** @internal */
export function WorkspaceProvider({
  children,
  workspace,
}: WorkspaceProviderProps): React.JSX.Element {
  return (
    <WorkspaceContext.Provider value={workspace}>
      {/*
       * Expose the workspace to the App SDK via SDKStudioContext so SDK hooks can
       * resolve the current project, dataset, and auth token. This is provided by
       * every WorkspaceProvider (including nested ones, e.g. the Tasks addon
       * workspace), but the single SanityApp that actually creates an SDK instance
       * is mounted once, for the primary workspace, in WorkspaceLoader.
       */}
      <SDKStudioContext.Provider value={workspace}>{children}</SDKStudioContext.Provider>
    </WorkspaceContext.Provider>
  )
}

/**
 * @hidden
 * @beta */
export function useWorkspace(): Workspace {
  const workspace = useContext(WorkspaceContext)

  if (!workspace) throw new Error('Workspace: missing context value')

  return workspace
}
