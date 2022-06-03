import {ErrorBoundary} from '@sanity/ui'
import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {History} from 'history'
import {map} from 'rxjs/operators'
import {resolveConfig, ResolvedConfig} from '../config'
import {createLocationStore, LocationStore} from './router'
import {useConfig} from './config'

interface LocationContextValue {
  store: LocationStore
  /**
   * @internal
   * @deprecated
   */
  __internal: {
    activeWorkspace: ResolvedConfig['__internal']['workspaces'][number]
    workspaces: ResolvedConfig['__internal']['workspaces']
  }
}
interface LocationProviderProps {
  children?: React.ReactChild
  history?: History
  noRoute: React.ReactNode
}

const LocationContext = createContext<LocationContextValue | null>(null)

export function useLocation() {
  const location = useContext(LocationContext)
  if (!location) throw new Error('Could not find `location` context')
  return location
}

// TODO: add metadata
class NoMatchingWorkspaceError extends Error {}

function LocationProviderBoundary({noRoute, ...props}: LocationProviderProps) {
  const [{error}, setError] = useState<{error: unknown}>({error: null})

  // TODO
  // const schemaValidationProblemGroups = source.schema._validation
  // const schemaErrors = useMemo(
  //   () =>
  //     schemaValidationProblemGroups?.filter(
  //       (msg) => !!msg.problems.find((p) => p.severity === 'error')
  //     ),
  //   [schemaValidationProblemGroups]
  // )

  // if (schemaValidationProblemGroups && schemaErrors && schemaErrors.length > 0) {
  //   return <SchemaErrorsScreen problemGroups={schemaValidationProblemGroups} />
  // }

  // TODO
  if (error instanceof NoMatchingWorkspaceError) {
    return <>{noRoute}</>
  }

  // TODO
  // Maybe redirect to base
  // this is run when the router is created only
  // useEffect(() => {
  //   const redirectTo = router.getRedirectBase(location.pathname)

  //   if (redirectTo) {
  //     history.replaceState(null, document.title, redirectTo)
  //   }
  // }, [router])

  if (error) throw error

  return (
    <ErrorBoundary onCatch={setError}>
      <LocationProvider {...props} />
    </ErrorBoundary>
  )
}

function normalizePath(path: string) {
  return path
    .toLowerCase()
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/')
}

// TODO: could rename to routing
function LocationProvider({history, children}: Omit<LocationProviderProps, 'noRoute'>) {
  const [error, handleError] = useState<unknown>(null)
  if (error) throw error

  const _config = useConfig()
  const config = useMemo(() => resolveConfig(_config), [_config])
  const {workspaces} = config.__internal

  const findActiveWorkspace = useCallback(
    (location: {pathname: string}) => {
      const pathname = normalizePath(location.pathname)
      const activeWorkspace = workspaces.find((workspace) =>
        pathname.startsWith(normalizePath(workspace.basePath))
      )

      if (!activeWorkspace) throw new NoMatchingWorkspaceError()
      return activeWorkspace
    },
    [workspaces]
  )

  const [activeWorkspace, setActiveWorkspace] = useState(() =>
    typeof document === 'undefined' ? workspaces[0] : findActiveWorkspace(document.location)
  )

  const locationStore = useMemo(() => createLocationStore({history}), [history])

  useEffect(() => {
    locationStore.event$.pipe(map((e) => findActiveWorkspace(e.location))).subscribe({
      next: setActiveWorkspace,
      error: handleError,
    })
  }, [locationStore, findActiveWorkspace, workspaces])

  return (
    <LocationContext.Provider
      value={useMemo(
        () => ({store: locationStore, __internal: {activeWorkspace, workspaces}}),
        [activeWorkspace, locationStore, workspaces]
      )}
    >
      {children}
    </LocationContext.Provider>
  )
}

export {LocationProviderBoundary as LocationProvider}
