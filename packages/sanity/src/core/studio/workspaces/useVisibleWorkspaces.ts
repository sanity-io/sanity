import {useMemo} from 'react'

import {type WorkspaceSummary} from '../../config/types'
import {type AuthState} from '../../store/_legacy/authStore/types'
import {useWorkspaceAuthStates} from '../components/navbar/workspace/hooks'
import {useWorkspaces} from './useWorkspaces'

/** @internal */
export interface VisibleWorkspacesResult {
  visibleWorkspaces: WorkspaceSummary[]
  allWorkspaces: WorkspaceSummary[]
  loading: boolean
}

/**
 * Evaluates a workspace's `hidden` property against the given auth state.
 * Falls open (returns `false`) when auth state is unavailable or the callback throws.
 *
 * @internal
 */
export function evaluateWorkspaceHidden(
  workspace: WorkspaceSummary,
  authState: AuthState | undefined,
): boolean {
  const {hidden} = workspace

  if (typeof hidden === 'boolean') {
    return hidden
  }

  if (typeof hidden === 'function') {
    if (authState === undefined) {
      return false
    }

    try {
      return hidden({currentUser: authState.currentUser})
    } catch (error) {
      console.warn(`Error evaluating \`hidden\` callback for workspace "${workspace.name}":`, error)
      return false
    }
  }

  return false
}

/** @internal */
export function useVisibleWorkspaces(): VisibleWorkspacesResult {
  const allWorkspaces = useWorkspaces()
  const [authStates] = useWorkspaceAuthStates(allWorkspaces)

  const loading = authStates === null

  const visibleWorkspaces = useMemo(() => {
    return allWorkspaces.filter(
      (workspace) => !evaluateWorkspaceHidden(workspace, authStates?.[workspace.name]),
    )
  }, [allWorkspaces, authStates])

  return useMemo(
    () => ({visibleWorkspaces, allWorkspaces, loading}),
    [visibleWorkspaces, allWorkspaces, loading],
  )
}
