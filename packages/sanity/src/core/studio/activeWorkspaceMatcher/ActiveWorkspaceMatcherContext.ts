import type {WorkspaceSummary} from '../../config/types'

/** @internal */
export interface ActiveWorkspaceMatcherContextValue {
  activeWorkspace: WorkspaceSummary
  setActiveWorkspace: (workspaceName: string) => void
}
