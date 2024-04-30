import {memo, type ReactNode, useMemo} from 'react'
import {ActiveWorkspaceMatcherContext} from 'sanity/_singletons'

import {type RouterHistory} from '../router'
import {RouterHistoryProvider} from '../router/RouterHistoryContext'
import {type WorkspacesContextValue} from '../workspaces'
import {type ActiveWorkspaceMatcherContextValue} from './ActiveWorkspaceMatcherContext'

/** @internal */
export const ActiveWorkspaceMatcherProvider = memo(function ActiveWorkspaceMatcherContextProvider({
  children,
  history,
  activeWorkspace,
  setActiveWorkspace,
}: {
  children: ReactNode
  history: RouterHistory
  activeWorkspace: WorkspacesContextValue[number]
  setActiveWorkspace: (workspaceName: string) => void
}) {
  const value = useMemo(
    () =>
      ({
        activeWorkspace,
        setActiveWorkspace,
      }) satisfies ActiveWorkspaceMatcherContextValue,
    [activeWorkspace, setActiveWorkspace],
  )

  return (
    <ActiveWorkspaceMatcherContext.Provider value={value}>
      <RouterHistoryProvider history={history}>{children}</RouterHistoryProvider>
    </ActiveWorkspaceMatcherContext.Provider>
  )
})
