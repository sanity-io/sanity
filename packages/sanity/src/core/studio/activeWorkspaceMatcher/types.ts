import type {WorkspacesContextValue} from '../workspaces/WorkspacesContext'

/** @internal */
export type NormalizedWorkspace = {
  workspace: WorkspacesContextValue[number]
  name?: string | undefined
  basePath: string
  basePathRegex: RegExp
}
