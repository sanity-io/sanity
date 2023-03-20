import React, {useCallback, useEffect, useMemo} from 'react'
import {createBrowserHistory, createMemoryHistory} from 'history'
import {useWorkspaces} from '../workspaces'
import type {RouterHistory} from '../router'
import {useSyncPathnameWithWorkspace} from './useSyncPathnameWithWorkspace'
import {ActiveWorkspaceMatcherProvider} from './ActiveWorkspaceMatcherProvider'

/** @internal */
export interface ActiveWorkspaceMatcherProps {
  children: React.ReactNode
  unstable_history?: RouterHistory
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

  const result = useSyncPathnameWithWorkspace(history, workspaces)

  useEffect(() => {
    if (result.type === 'redirect') {
      history.replace(result.pathname)
    }
  }, [history, result])

  switch (result.type) {
    case 'match':
      return (
        <ActiveWorkspaceMatcherProvider
          activeWorkspace={result.workspace}
          history={history}
          setActiveWorkspace={setActiveWorkspaceName}
        >
          {children}
        </ActiveWorkspaceMatcherProvider>
      )
    case 'redirect':
      return <LoadingComponent />
    case 'not-found':
      return <NotFoundComponent onNavigateToDefaultWorkspace={handleNavigateToDefaultWorkspace} />
    default:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TS thinks this will never happen, but the point of the error is if it somehow did
      throw new Error(`Unknown type: ${(result as any).type}`)
  }
}
