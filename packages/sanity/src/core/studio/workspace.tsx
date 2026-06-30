import {SanityApp, SDKStudioContext} from '@sanity/sdk-react'
import {useContext} from 'react'
import {WorkspaceContext} from 'sanity/_singletons'

import {LoadingBlock} from '../components/loadingBlock'
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
       * Always provide the workspace to the App SDK so SDK hooks can resolve the
       * project, dataset, and auth token. When the `sdk` config option is set, we
       * also mount a single SanityApp at the workspace root. Everything beneath
       * reuses that one instance (SanityApp/ResourceProvider reuse the nearest
       * ancestor instance), so SDK code works without any extra providers and we
       * avoid spawning a separate instance per consumer. SanityApp must render
       * inside SDKStudioContext so it can derive its config from the workspace.
       */}
      <SDKStudioContext.Provider value={workspace}>
        {workspace.sdk ? (
          <SanityApp fallback={<LoadingBlock fill />}>{children}</SanityApp>
        ) : (
          children
        )}
      </SDKStudioContext.Provider>
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
