import React, {useCallback, useEffect, useMemo, useSyncExternalStore} from 'react'
import {History, createBrowserHistory, createMemoryHistory} from 'history'
import {useWorkspaces} from '../workspaces'
import {WorkspaceSummary} from '../../config'
import {
  ActiveWorkspaceMatcherContext,
  type ActiveWorkspaceMatcherContextValue,
} from './ActiveWorkspaceMatcherContext'
import {matchWorkspace} from './matchWorkspace'

/** @internal */
export interface ActiveWorkspaceMatcherProps {
  children?: React.ReactChild
  unstable_history?: History
  NotFoundComponent: React.ComponentType<{onNavigateToDefaultWorkspace: () => void}>
  LoadingComponent: React.ComponentType
}

const createHistory = () =>
  typeof document === 'undefined' ? createMemoryHistory() : createBrowserHistory()

/** @internal */
export function ActiveWorkspaceMatcher({
  children,
  LoadingComponent,
  NotFoundComponent,
  unstable_history: historyProp,
}: ActiveWorkspaceMatcherProps) {
  const workspaces = useWorkspaces()

  const history = useMemo(() => historyProp || createHistory(), [historyProp])
  const pathname = useSyncExternalStore(
    history.listen,
    useCallback(() => history.location.pathname, [history])
  )

  const result = useMemo(() => matchWorkspace({pathname, workspaces}), [pathname, workspaces])
  const activeWorkspace = result.type === 'match' ? result.workspace : null

  const nextRedirect = result.type === 'redirect' ? result.pathname : null
  useEffect(() => {
    if (nextRedirect) {
      history.replace(nextRedirect)
    }
  }, [history, nextRedirect])

  const setActiveWorkspaceName = useCallback(
    (workspaceName: string) => {
      const foundWorkspace = workspaces.find((workspace) => workspace.name === workspaceName)
      if (foundWorkspace) {
        history.push(foundWorkspace.basePath)
      }
    },
    [history, workspaces]
  )

  const handleNavigateToDefaultWorkspace = useCallback(() => {
    setActiveWorkspaceName(workspaces[0].name)
  }, [setActiveWorkspaceName, workspaces])

  const value = useMemo(
    () => ({
      __internal: {history},
      activeWorkspace: activeWorkspace,
      setActiveWorkspace: setActiveWorkspaceName,
    }),
    [history, activeWorkspace, setActiveWorkspaceName]
  )

  if (result.type === 'not-found') {
    return <NotFoundComponent onNavigateToDefaultWorkspace={handleNavigateToDefaultWorkspace} />
  }

  if (!activeWorkspace) {
    return <LoadingComponent />
  }

  return (
    <ActiveWorkspaceMatcherContext.Provider value={value as ActiveWorkspaceMatcherContextValue}>
      {children}
    </ActiveWorkspaceMatcherContext.Provider>
  )
}
