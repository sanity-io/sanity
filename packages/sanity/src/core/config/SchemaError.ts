import {type Schema} from '@sanity/types'

/** @internal */
// TODO: consider removing this error in favor of the `ConfigResolutionError`
export class SchemaError extends Error {
  public schema: Schema
  constructor(schema: Schema) {
    super('SchemaError')
    this.schema = schema
    this.name = 'SchemaError'
  }
}
