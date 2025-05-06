import {
  defineProjection,
  defineQuery,
  type PickProjectionResult,
  type PickSchema,
  type ProjectionBase,
  type SanityDocument,
  type SanityProjectionResult,
  type SanityProjections,
  type SanityQueries,
  type SanityQueryResult,
  type SanitySchema,
  type SanitySchemas,
  type SanitySchemaType,
  type SchemaOrigin,
} from './define'
import {groq} from './groq'

module.exports = groq

Object.assign(module.exports, {defineQuery, defineProjection})

/**
 * This is just to fix the typegen for the CJS export, as TS won't pick up on `module.exports` syntax when the package.json has `type: "module"`
 */
export type {
  groq as default,
  defineProjection,
  defineQuery,
  PickProjectionResult,
  PickSchema,
  ProjectionBase,
  SanityDocument,
  SanityProjectionResult,
  SanityProjections,
  SanityQueries,
  SanityQueryResult,
  SanitySchema,
  SanitySchemas,
  SanitySchemaType,
  SchemaOrigin,
}
