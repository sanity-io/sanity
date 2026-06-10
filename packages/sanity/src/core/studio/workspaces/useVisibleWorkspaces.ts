import {useContext} from 'react'
import {VisibleWorkspacesContext} from 'sanity/_singletons'

import {type WorkspaceSummary} from '../../config/types'
import {type AuthState} from '../../store/authStore/types'
import {type VisibleWorkspacesContextValue} from './VisibleWorkspacesProvider'

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
      console.error(
        `Error evaluating \`hidden\` callback for workspace "${workspace.name}":`,
        error,
      )
      return false
    }
  }

  return false
}

/**
 * Returns visible workspaces and auth states from the nearest
 * `VisibleWorkspacesProvider`.
 *
 * @internal
 */
export function useVisibleWorkspaces(): VisibleWorkspacesContextValue {
  const context = useContext(VisibleWorkspacesContext)
  if (context === null) {
    throw new Error('useVisibleWorkspaces: missing VisibleWorkspacesProvider in component tree')
  }
  return context
}
