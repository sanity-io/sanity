import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {map, filter, scan, catchError} from 'rxjs/operators'
import {combineLatest, of} from 'rxjs'
import {History} from 'history'
import {ErrorBoundary} from '@sanity/ui'
import {createHookFromObservableFactory} from '../../util'
import {ConfigResolutionError, Tool, Source, Workspace} from '../../config'
import {createRouter, createRouterEventStream} from '../router'
import {useActiveWorkspace} from '../activeWorkspaceMatcher'
import {WorkspaceProvider} from '../workspace'
import {SourceProvider} from '../source'
import {Router, RouterProvider, RouterState} from 'sanity/router'
// TODO: work on error handler
// import {flattenErrors} from './flattenErrors'

const isStateEvent = <T extends {type: string}>(e: T): e is Extract<T, {type: 'state'}> =>
  e.type === 'state'

const initialState: StudioRouterState = {isNotFound: true, state: {}}

interface StudioRouterState {
  isNotFound: boolean
  state: RouterState
}

type UseRouterStateOptions = [
  unstable_history: History,
  router: Router | undefined,
  tools: Tool[] | undefined
]

const useRouterState = createHookFromObservableFactory(
  ([unstable_history, router, tools]: UseRouterStateOptions) => {
    if (!router || !tools) return of(initialState)

    return createRouterEventStream({
      unstable_history,
      router,
      tools,
    }).pipe(
      filter(isStateEvent),
      scan((prevState, event) => {
        return {
          ...prevState,
          isNotFound: event.isNotFound,
          state: event.state,
        }
      }, initialState)
    )
  },
  initialState
)

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

  const {
    activeWorkspace,
    __internal: {history},
  } = useActiveWorkspace()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)

  const handleNavigate = useCallback(
    (opts: {path: string; replace?: boolean}) => {
      if (opts.replace) {
        history.replace(opts.path)
      } else {
        history.push(opts.path)
      }
    },
    [history]
  )

  useEffect(() => {
    const subscription = combineLatest(
      activeWorkspace.__internal.sources.map(({source}) =>
        source.pipe(
          catchError((err) => {
            if (err instanceof ConfigResolutionError) return of(err)
            throw err
          })
        )
      )
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
          })
        )
      )
      .subscribe({
        next: setWorkspace,
        error: handleError,
      })

    return () => subscription.unsubscribe()
  }, [activeWorkspace])

  const tools = workspace?.tools
  const router = useMemo(() => {
    if (!workspace) return undefined
    return createRouter(workspace)
  }, [workspace])

  const [routerState] = useRouterState(
    useMemo(() => [history, router, tools], [history, router, tools])
  )
  if (!router || !workspace) return <LoadingComponent />

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
        <RouterProvider onNavigate={handleNavigate} router={router} state={routerState.state}>
          {children}
        </RouterProvider>
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
