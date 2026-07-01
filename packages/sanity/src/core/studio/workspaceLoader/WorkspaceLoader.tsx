import {ResourceProvider} from '@sanity/sdk-react'
import {type ComponentType, type ReactNode, useEffect, useState} from 'react'
import {combineLatest, of} from 'rxjs'
import {catchError, map} from 'rxjs/operators'

import {ErrorBoundary} from '../../../ui-components'
import {
  ConfigResolutionError,
  type Source,
  type Workspace,
  type WorkspaceSummary,
} from '../../config'
import {useActiveWorkspace} from '../activeWorkspaceMatcher'
import {SourceProvider} from '../source'
import {WorkspaceProvider} from '../workspace'
import {WorkspaceRouterProvider} from './WorkspaceRouterProvider'

// TODO: work on error handler
// import {flattenErrors} from './flattenErrors'

interface WorkspaceLoaderProps {
  children: ReactNode
  ConfigErrorsComponent: ComponentType
  LoadingComponent: ComponentType
}

/**
 * @internal
 */
export function useWorkspaceLoader(activeWorkspace: WorkspaceSummary) {
  const [error, handleError] = useState<unknown>(null)
  if (error) throw error

  const [workspace, setWorkspace] = useState<Workspace | null>(null)

  useEffect(() => {
    const subscription = combineLatest(
      activeWorkspace.__internal.sources.map(({source}) =>
        source.pipe(
          catchError((err) => {
            if (err instanceof ConfigResolutionError) return of(err)
            throw err
          }),
        ),
      ),
    )
      .pipe(
        map((results): Source[] => {
          const errors = results.filter((result) => result instanceof ConfigResolutionError)
          if (errors.length) {
            throw new ConfigResolutionError({
              name: activeWorkspace.name,
              causes: errors,
              type: 'workspace',
            })
          }

          return results as Source[]
        }),
        map(([rootSource, ...restOfSources]): Workspace => {
          const {releases: _releases, ...workspaceMetadata} = activeWorkspace
          return {
            ...workspaceMetadata,
            ...rootSource,
            unstable_sources: [rootSource, ...restOfSources],
            type: 'workspace',
          }
        }),
      )
      .subscribe({
        next: setWorkspace,
        error: handleError,
      })

    return () => subscription.unsubscribe()
  }, [activeWorkspace])

  return workspace
}

function WorkspaceLoader({
  children,
  LoadingComponent,
}: Omit<WorkspaceLoaderProps, 'ConfigErrorsComponent'>) {
  const {activeWorkspace} = useActiveWorkspace()
  const workspace = useWorkspaceLoader(activeWorkspace)
  if (!workspace) return <LoadingComponent />

  // TODO: may need a screen if one of the sources is not logged in. e.g. it
  // is currently possible for the user to be logged into the current workspace
  // but not all of its nested sources.
  // if (!allSourcesLoggedIn) return <NotAllSourcesAuthenticatedComponent />

  return (
    <WorkspaceProvider workspace={workspace}>
      {/*
       * Mount a single App SDK instance for the primary workspace so SDK hooks
       * work anywhere in the Studio. It lives here, not in WorkspaceProvider, so
       * nested workspaces (e.g. the Tasks addon dataset) don't each spawn one.
       *
       * We use ResourceProvider, not SanityApp: SanityApp also mounts the SDK's
       * AuthBoundary, which replaces its whole subtree on an SDK auth error and
       * would take over the Studio. The Studio already gates auth above this, so
       * we only want the SDK instance and its Suspense boundary. The instance is
       * configured in studio mode from the workspace token, so hooks auth via the
       * Studio session.
       */}
      <ResourceProvider
        projectId={workspace.projectId}
        dataset={workspace.dataset}
        studio={{
          authenticated: workspace.authenticated,
          auth: workspace.auth.token ? {token: workspace.auth.token} : undefined,
        }}
        fallback={<LoadingComponent />}
      >
        <SourceProvider
          // the first source is always the root source and is always present
          source={workspace.unstable_sources[0]}
        >
          <WorkspaceRouterProvider LoadingComponent={LoadingComponent} workspace={workspace}>
            {children}
          </WorkspaceRouterProvider>
        </SourceProvider>
      </ResourceProvider>
    </WorkspaceProvider>
  )
}

/**
 * @internal
 */
function WorkspaceLoaderBoundary({ConfigErrorsComponent, ...props}: WorkspaceLoaderProps) {
  const [{error}, setError] = useState<{error: unknown}>({error: null})

  // TODO: implement this
  // const errors = useMemo(() => flattenErrors(error, []), [error])

  //TODO: implement config error screen - a story has been created for this
  // if (error instanceof ConfigResolutionError) return <ConfigErrorsComponent />

  // otherwise hand off to other boundaries
  if (error) throw error

  return (
    <ErrorBoundary onCatch={setError}>
      <WorkspaceLoader {...props} />
    </ErrorBoundary>
  )
}

export {WorkspaceLoaderBoundary as WorkspaceLoader}
