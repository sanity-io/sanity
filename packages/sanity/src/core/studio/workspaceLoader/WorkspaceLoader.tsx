import React, {useEffect, useState} from 'react'
import {map, catchError} from 'rxjs/operators'
import {combineLatest, of} from 'rxjs'
import {ErrorBoundary} from '@sanity/ui'
import {ConfigResolutionError, Source, Workspace} from '../../config'
import {useActiveWorkspace} from '../activeWorkspaceMatcher'
import {WorkspaceProvider} from '../workspace'
import {SourceProvider} from '../source'
import {WorkspaceRouterProvider} from './WorkspaceRouterProvider'

// TODO: work on error handler
// import {flattenErrors} from './flattenErrors'

interface WorkspaceLoaderProps {
  children: React.ReactNode
  ConfigErrorsComponent: React.ComponentType
  LoadingComponent: React.ComponentType
}

function WorkspaceLoader({
  children,
  LoadingComponent,
}: Omit<WorkspaceLoaderProps, 'ConfigErrorsComponent'>) {
  const [error, handleError] = useState<unknown>(null)
  if (error) throw error

  const {activeWorkspace} = useActiveWorkspace()
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
        map(
          ([rootSource, ...restOfSources]): Workspace => ({
            ...activeWorkspace,
            ...rootSource,
            unstable_sources: [rootSource, ...restOfSources],
            type: 'workspace',
          }),
        ),
      )
      .subscribe({
        next: setWorkspace,
        error: handleError,
      })

    return () => subscription.unsubscribe()
  }, [activeWorkspace])

  if (!workspace) return <LoadingComponent />

  // TODO: may need a screen if one of the sources is not logged in. e.g. it
  // is currently possible for the user to be logged into the current workspace
  // but not all of its nested sources.
  // if (!allSourcesLoggedIn) return <NotAllSourcesAuthenticatedComponent />

  return (
    <WorkspaceProvider workspace={workspace}>
      <SourceProvider
        // the first source is always the root source and is always present
        source={workspace.unstable_sources[0]}
      >
        <WorkspaceRouterProvider LoadingComponent={LoadingComponent} workspace={workspace}>
          {children}
        </WorkspaceRouterProvider>
      </SourceProvider>
    </WorkspaceProvider>
  )
}

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
