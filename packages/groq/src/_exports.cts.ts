import {
  defineDocumentProjection,
  defineQuery,
  type DocumentProjectionBase,
  type SanityDocument,
  type SanityDocumentProjectionResult,
  type SanityDocumentProjections,
  type SanityQueries,
  type SanityQueryResult,
  type SanitySchema,
  type SanitySchemas,
  type SanitySchemaType,
} from './define'
import {groq} from './groq'

module.exports = groq

Object.assign(module.exports, {defineQuery, defineDocumentProjection})

/**
 * This is just to fix the typegen for the CJS export, as TS won't pick up on `module.exports` syntax when the package.json has `type: "module"`
 */
export type {
  groq as default,
  defineDocumentProjection,
  defineQuery,
  DocumentProjectionBase,
  SanityDocument,
  SanityDocumentProjectionResult,
  SanityDocumentProjections,
  SanityQueries,
  SanityQueryResult,
  SanitySchema,
  SanitySchemas,
  SanitySchemaType,
}
