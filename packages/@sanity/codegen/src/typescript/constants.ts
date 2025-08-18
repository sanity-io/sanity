import * as t from '@babel/types'

export const INTERNAL_REFERENCE_SYMBOL = t.identifier('internalGroqTypeReferenceTo')
export const ALL_SANITY_SCHEMA_TYPES = t.identifier('AllSanitySchemaTypes')
export const DEFAULT_SCHEMA = t.identifier('DefaultSchema')
export const SANITY_SCHEMAS = t.identifier('SanitySchemas')
export const SANITY_QUERIES = t.identifier('SanityQueries')
export const SANITY_DOCUMENT_PROJECTIONS = t.identifier('SanityDocumentProjections')
export const DOCUMENT_PROJECTION_BASE = t.identifier('DocumentProjectionBase')

export const RESERVED_IDENTIFIERS = new Set<string>()
RESERVED_IDENTIFIERS.add(INTERNAL_REFERENCE_SYMBOL.name)
RESERVED_IDENTIFIERS.add(ALL_SANITY_SCHEMA_TYPES.name)
RESERVED_IDENTIFIERS.add(DEFAULT_SCHEMA.name)
RESERVED_IDENTIFIERS.add(SANITY_SCHEMAS.name)
RESERVED_IDENTIFIERS.add(SANITY_QUERIES.name)
RESERVED_IDENTIFIERS.add(SANITY_DOCUMENT_PROJECTIONS.name)
RESERVED_IDENTIFIERS.add(DOCUMENT_PROJECTION_BASE.name)
