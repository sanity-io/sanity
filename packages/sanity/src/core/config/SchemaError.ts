import {Schema} from '@sanity/types'

/** @internal */
// TODO: consider removing this error in favor of the `ConfigResolutionError`
export class SchemaError extends Error {
  constructor(public schema: Schema) {
    super('SchemaError')
  }
}
