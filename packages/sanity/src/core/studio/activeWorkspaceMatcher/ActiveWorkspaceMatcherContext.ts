import {createContext} from 'react'

import {type WorkspaceSummary} from '../../config'

/** @internal */
export interface ActiveWorkspaceMatcherContextValue {
  activeWorkspace: WorkspaceSummary
  setActiveWorkspace: (workspaceName: string) => void
}

/** @internal */
export const ActiveWorkspaceMatcherContext =
  createContext<ActiveWorkspaceMatcherContextValue | null>(null)
