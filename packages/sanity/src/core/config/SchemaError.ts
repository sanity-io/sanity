import {type Schema} from '@sanity/types'

/**
 * Identifies the workspace and source whose schema failed to compile, so a studio
 * with many workspaces can point at the one that needs fixing.
 *
 * @internal
 */
export interface SchemaErrorContext {
  /** The name of the workspace the source belongs to */
  workspaceName: string
  /** The name of the source, set only when the failing source is a nested one */
  sourceName?: string
  /** The Sanity project ID */
  projectId: string
  /** The dataset name */
  dataset: string
}

function describeContext(context: SchemaErrorContext): string {
  const location = context.sourceName
    ? `source "${context.sourceName}" in workspace "${context.workspaceName}"`
    : `workspace "${context.workspaceName}"`

  return ` in ${location} (project: ${context.projectId}, dataset: ${context.dataset})`
}

/** @internal */
// TODO: consider removing this error in favor of the `ConfigResolutionError`
export class SchemaError extends Error {
  public schema: Schema
  public context?: SchemaErrorContext

  constructor(schema: Schema, context?: SchemaErrorContext) {
    super(`Schema has validation errors${context ? describeContext(context) : ''}`)
    this.schema = schema
    this.context = context
    this.name = 'SchemaError'
  }
}
