import {createBrowserHistory, createMemoryHistory} from 'history'
import {type ComponentType, type ReactNode, useCallback, useEffect, useMemo} from 'react'

import {type RouterHistory} from '../router/types'
import {useVisibleWorkspaces} from '../workspaces/useVisibleWorkspaces'
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
  const allWorkspaces = useWorkspaces()
  const {visibleWorkspaces, workspaceAuthStates} = useVisibleWorkspaces()
  const history = useMemo(() => historyProp || createHistory(), [historyProp])

  const setActiveWorkspaceName = useCallback(
    (workspaceName: string) => {
      const foundWorkspace = visibleWorkspaces.find((workspace) => workspace.name === workspaceName)
      if (foundWorkspace) {
        history.push(foundWorkspace.basePath)
      }
    },
    [history, visibleWorkspaces],
  )

  const handleNavigateToDefaultWorkspace = useCallback(() => {
    history.push('/')
  }, [history])

  const result = useSyncPathnameWithWorkspace(history, allWorkspaces, workspaceAuthStates)

  useEffect(() => {
    if (result.type === 'redirect') {
      history.replace({
        pathname: result.pathname,
        search: history.location.search,
        hash: history.location.hash,
      })
    }
  }, [history, result])

  switch (result.type) {
    case 'match': {
      const matchedWorkspace = result.workspace

      const matchedWorkspaceIsVisible = visibleWorkspaces.some(
        (workspace) => workspace.name === matchedWorkspace.name,
      )

      // Only reachable when every workspace is hidden: matchWorkspace redirects
      // away from a hidden workspace whenever a visible one exists.
      if (!matchedWorkspaceIsVisible) {
        return <NotFoundComponent onNavigateToDefaultWorkspace={handleNavigateToDefaultWorkspace} />
      }

      return (
        <ActiveWorkspaceMatcherProvider
          activeWorkspace={matchedWorkspace}
          history={history}
          setActiveWorkspace={setActiveWorkspaceName}
        >
          {children}
        </ActiveWorkspaceMatcherProvider>
      )
    }
    case 'redirect':
    case 'loading':
      return <LoadingComponent />
    case 'not-found':
      return <NotFoundComponent onNavigateToDefaultWorkspace={handleNavigateToDefaultWorkspace} />
    default:
      // oxlint-disable-next-line no-explicit-any
      throw new Error(`Unknown type: ${(result as any).type}`)
  }
}
