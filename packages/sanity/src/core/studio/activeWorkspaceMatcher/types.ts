import type {WorkspacesContextValue} from '../workspaces'

/** @internal */
export type NormalizedWorkspace = {
  workspace: WorkspacesContextValue[number]
  name?: string | undefined
  basePath: string
  basePathRegex: RegExp
}
