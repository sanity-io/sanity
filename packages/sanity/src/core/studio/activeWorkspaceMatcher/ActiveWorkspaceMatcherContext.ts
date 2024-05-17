import {type WorkspaceSummary} from '../../config'

/** @internal */
export interface ActiveWorkspaceMatcherContextValue {
  activeWorkspace: WorkspaceSummary
  setActiveWorkspace: (workspaceName: string) => void
}
