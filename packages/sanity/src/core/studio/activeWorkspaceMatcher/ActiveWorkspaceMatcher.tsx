import {createBrowserHistory, createMemoryHistory} from 'history'
import {type ComponentType, type ReactNode, useCallback, useEffect, useMemo} from 'react'

import type {RouterHistory} from '../router/types'
import {useWorkspaces} from '../workspaces/useWorkspaces'
import {ActiveWorkspaceMatcherProvider} from './ActiveWorkspaceMatcherProvider'
import {useSyncPathnameWithWorkspace} from './useSyncPathnameWithWorkspace'

/** @internal */
export interface ActiveWorkspaceMatcherProps {
  children: ReactNode
  unstable_history?: RouterHistory
  NotFoundComponent: ComponentType<{onNavigateToDefaultWorkspace: () => void}>
  LoadingComponent: ComponentType
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
    [history, workspaces],
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
      // oxlint-disable-next-line no-explicit-any
      throw new Error(`Unknown type: ${(result as any).type}`)
  }
}
