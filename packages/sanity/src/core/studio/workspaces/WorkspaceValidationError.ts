import {getWorkspaceIdentifier} from './helpers'
import type {WorkspaceLike} from './types'

export interface WorkspaceValidationErrorOptions {
  workspace: WorkspaceLike
  index: number
}

/**
 * Thrown on workspace validation errors. Includes an identifier that is either the name of
 * the workspace, or in the case of a missing or invalid name, an index and a potential title
 */
export class WorkspaceValidationError extends Error {
  index?: number
  identifier?: string

  constructor(message: string, options?: WorkspaceValidationErrorOptions) {
    super(message)
    this.index = options?.index
    this.identifier = options?.workspace && getWorkspaceIdentifier(options.workspace, options.index)
  }
}
