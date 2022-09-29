import {createContext} from 'react'
import {History} from 'history'
import {WorkspaceSummary} from '../../config'

/** @internal */
export interface ActiveWorkspaceMatcherContextValue {
  activeWorkspace: WorkspaceSummary
  setActiveWorkspace: (workspaceName: string) => void
  /**
   * @deprecated internal use only
   */
  __internal: {
    history: History
  }
}

/** @internal */
export const ActiveWorkspaceMatcherContext =
  createContext<ActiveWorkspaceMatcherContextValue | null>(null)
