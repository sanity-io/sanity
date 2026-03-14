import {type Schema} from '@sanity/types'

/**
 * Context information about the source where the schema error occurred.
 * This helps users identify which workspace/dataset has the problematic schema.
 * @internal
 */
export interface SchemaErrorContext {
  /** The name of the source/workspace */
  sourceName: string
  /** The Sanity project ID */
  projectId: string
  /** The dataset name */
  dataset: string
}

/** @internal */
// TODO: consider removing this error in favor of the `ConfigResolutionError`
export class SchemaError extends Error {
  public schema: Schema
  public context?: SchemaErrorContext

  constructor(schema: Schema, context?: SchemaErrorContext) {
    const contextInfo = context
      ? ` in source "${context.sourceName}" (project: ${context.projectId}, dataset: ${context.dataset})`
      : ''
    super(`Schema has validation errors${contextInfo}`)
    this.schema = schema
    this.context = context
    this.name = 'SchemaError'
  }
}
