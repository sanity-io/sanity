import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {History, createBrowserHistory, createMemoryHistory} from 'history'
import {Observable} from 'rxjs'
import {map} from 'rxjs/operators'
import {useWorkspaces} from '../workspaces'
import {WorkspaceSummary} from '../../config'
import {
  ActiveWorkspaceMatcherContext,
  ActiveWorkspaceMatcherContextValue,
} from './ActiveWorkspaceMatcherContext'
import {matchWorkspace} from './matchWorkspace'

interface ActiveWorkspaceMatcherProps {
  children?: React.ReactChild
  unstable_history?: History
  NotFoundComponent: React.ComponentType<{onNavigateToDefaultWorkspace: () => void}>
  LoadingComponent: React.ComponentType
}

const createHistory = () =>
  typeof document === 'undefined' ? createMemoryHistory() : createBrowserHistory()

export function ActiveWorkspaceMatcher({
  children,
  LoadingComponent,
  NotFoundComponent,
  unstable_history: historyProp,
}: ActiveWorkspaceMatcherProps) {
  const [error, setError] = useState<unknown>(null)

  // Throw error to closest error boundary
  if (error) throw error

  const workspaces = useWorkspaces()

  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceSummary | null>(null)
  const [notFound, setNotFound] = useState(false)

  const history = useMemo(() => historyProp || createHistory(), [historyProp])

  useEffect(() => {
    const pathname$ = new Observable<string>((observer) => {
      const unlisten = history.listen((location) => observer.next(location.pathname))

      // Emit initial pathname
      observer.next(history.location.pathname || '/')

      return unlisten
    })

    const subscription = pathname$
      .pipe(map((pathname) => matchWorkspace({pathname, workspaces})))
      .subscribe({
        error: setError,
        next: (result) => {
          if (result.type === 'match') {
            setNotFound(false)
            setActiveWorkspace(result.workspace)
          }

          if (result.type === 'redirect') {
            history.replace(result.pathname)
          }

          if (result.type === 'not-found') {
            setNotFound(true)
          }
        },
      })

    return () => subscription.unsubscribe()
  }, [history, workspaces])

  const setActiveWorkspaceName = useCallback(
    (workspaceName: string) => {
      const foundWorkspace = workspaces.find((workspace) => workspace.name === workspaceName)
      if (foundWorkspace) {
        history.push(foundWorkspace.basePath)
      }
    },
    [history, workspaces]
  )

  const defaultWorkspaceName = workspaces[0].name
  const handleNavigateToDefaultWorkspace = useCallback(() => {
    setActiveWorkspaceName(defaultWorkspaceName)
  }, [setActiveWorkspaceName, defaultWorkspaceName])

  const value = useMemo(
    () => ({
      __internal: {history},
      activeWorkspace,
      setActiveWorkspace: setActiveWorkspaceName,
    }),
    [history, activeWorkspace, setActiveWorkspaceName]
  )

  if (notFound) {
    return <NotFoundComponent onNavigateToDefaultWorkspace={handleNavigateToDefaultWorkspace} />
  }

  if (!value.activeWorkspace) {
    return <LoadingComponent />
  }

  return (
    <ActiveWorkspaceMatcherContext.Provider value={value as ActiveWorkspaceMatcherContextValue}>
      {children}
    </ActiveWorkspaceMatcherContext.Provider>
  )
}
