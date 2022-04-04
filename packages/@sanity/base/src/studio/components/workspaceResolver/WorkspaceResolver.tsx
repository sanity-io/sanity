import React, {useEffect, useMemo, useState} from 'react'
import {map, filter, scan, catchError} from 'rxjs/operators'
import {combineLatest, of} from 'rxjs'
import {createHookFromObservableFactory} from '../../../util'
import {ConfigResolutionError, Tool, Source, Workspace} from '../../../config'
import {Router, RouterProvider, RouterState} from '../../../router'
import {createRouter, createRouterEventStream, LocationStore} from '../../router'
import {useLocation} from '../../location'
import {WorkspaceProvider} from '../../workspace'
import {SourceProvider} from '../../source'

const isStateEvent = <T extends {type: string}>(e: T): e is Extract<T, {type: 'state'}> =>
  e.type === 'state'

const initialState: StudioRouterState = {isNotFound: true, state: {}}

interface StudioRouterState {
  isNotFound: boolean
  state: RouterState
}

interface UseRouterStateOptions {
  locationStore: LocationStore
  router: Router | undefined
  tools: Tool[] | undefined
}

const useRouterState = createHookFromObservableFactory(
  ({tools, locationStore, router}: UseRouterStateOptions) => {
    if (!router || !tools) return of(initialState)

    return createRouterEventStream({
      tools,
      locationStore,
      router,
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
  {initialValue: initialState}
)

interface WorkspaceResolverProps {
  children: React.ReactNode
  loadingScreen: React.ReactNode
}

export function WorkspaceResolver({children, loadingScreen}: WorkspaceResolverProps) {
  const [error, handleError] = useState<unknown>(null)
  if (error) throw error

  const {store: locationStore, __internal} = useLocation()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const handleNavigate = locationStore.navigate.call

  useEffect(() => {
    const {activeWorkspace} = __internal

    combineLatest(
      activeWorkspace.sources.map((source) =>
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
          })
        )
      )
      .subscribe({
        next: setWorkspace,
        error: handleError,
      })
  }, [__internal, locationStore])

  const {router, tools} = useMemo(() => {
    if (!workspace) return {}

    return {
      tools: workspace.tools,
      router: createRouter({basePath: workspace.basePath, tools: workspace.tools}),
    }
  }, [workspace])

  const [routerState] = useRouterState({locationStore, router, tools})

  if (!router || !workspace) return <>{loadingScreen}</>

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
