import {createBrowserHistory, createMemoryHistory} from 'history'
import {type ComponentType, type ReactNode, useCallback, useEffect, useMemo} from 'react'

import {useWorkspaceAuthStates} from '../components/navbar/workspace/hooks'
import {type RouterHistory} from '../router'
import {evaluateWorkspaceHidden, useWorkspaces} from '../workspaces'
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
  const candidateWorkspaces = useMemo(
    () => allWorkspaces.filter((workspace) => workspace.hidden !== true),
    [allWorkspaces],
  )
  const [authStates] = useWorkspaceAuthStates(allWorkspaces)
  const history = useMemo(() => historyProp || createHistory(), [historyProp])

  const firstVisibleWorkspace = useMemo(
    () =>
      candidateWorkspaces.find(
        (workspace) => !evaluateWorkspaceHidden(workspace, authStates?.[workspace.name]),
      ),
    [candidateWorkspaces, authStates],
  )

  const setActiveWorkspaceName = useCallback(
    (workspaceName: string) => {
      const foundWorkspace = candidateWorkspaces.find(
        (workspace) => workspace.name === workspaceName,
      )
      if (
        foundWorkspace &&
        !evaluateWorkspaceHidden(foundWorkspace, authStates?.[foundWorkspace.name])
      ) {
        history.push(foundWorkspace.basePath)
      }
    },
    [history, candidateWorkspaces, authStates],
  )

  const handleNavigateToDefaultWorkspace = useCallback(() => {
    if (firstVisibleWorkspace) {
      setActiveWorkspaceName(firstVisibleWorkspace.name)
    }
  }, [setActiveWorkspaceName, firstVisibleWorkspace])

  const result = useSyncPathnameWithWorkspace(history, candidateWorkspaces)

  const matchedWorkspaceIsHidden =
    result.type === 'match' &&
    evaluateWorkspaceHidden(result.workspace, authStates?.[result.workspace.name])

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

      if (typeof matchedWorkspace.hidden === 'function' && authStates === null) {
        return <LoadingComponent />
      }

      if (matchedWorkspaceIsHidden) {
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
      return <LoadingComponent />
    case 'not-found':
      return <NotFoundComponent onNavigateToDefaultWorkspace={handleNavigateToDefaultWorkspace} />
    default:
      // oxlint-disable-next-line no-explicit-any
      throw new Error(`Unknown type: ${(result as any).type}`)
  }
}
