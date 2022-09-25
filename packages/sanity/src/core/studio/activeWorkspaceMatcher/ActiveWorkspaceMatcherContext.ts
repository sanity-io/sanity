import {createContext} from 'react'
import {History} from 'history'
import {WorkspaceSummary} from '../../config'

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

export const ActiveWorkspaceMatcherContext =
  createContext<ActiveWorkspaceMatcherContextValue | null>(null)
