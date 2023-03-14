import React, {memo, useMemo} from 'react'
import type {RouterHistory} from '../router'
import {RouterHistoryProvider} from '../router/RouterHistoryContext'
import type {WorkspacesContextValue} from '../workspaces'
import {
  ActiveWorkspaceMatcherContext,
  type ActiveWorkspaceMatcherContextValue,
} from './ActiveWorkspaceMatcherContext'

/** @internal */
export const ActiveWorkspaceMatcherProvider = memo(function ActiveWorkspaceMatcherContextProvider({
  children,
  history,
  activeWorkspace,
  setActiveWorkspace,
}: {
  children: React.ReactNode
  history: RouterHistory
  activeWorkspace: WorkspacesContextValue[number]
  setActiveWorkspace: (workspaceName: string) => void
}) {
  const value = useMemo(
    () =>
      ({
        activeWorkspace,
        setActiveWorkspace,
      } satisfies ActiveWorkspaceMatcherContextValue),
    [activeWorkspace, setActiveWorkspace]
  )

  return (
    <ActiveWorkspaceMatcherContext.Provider value={value}>
      <RouterHistoryProvider history={history}>{children}</RouterHistoryProvider>
    </ActiveWorkspaceMatcherContext.Provider>
  )
})
