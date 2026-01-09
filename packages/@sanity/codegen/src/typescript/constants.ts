import * as t from '@babel/types'

export const INTERNAL_REFERENCE_SYMBOL = t.identifier('internalGroqTypeReferenceTo')
export const ALL_SANITY_SCHEMA_TYPES = t.identifier('AllSanitySchemaTypes')
export const SANITY_QUERIES = t.identifier('SanityQueries')
export const ARRAY_OF = t.identifier('ArrayOf')

export const RESERVED_IDENTIFIERS = new Set<string>()
RESERVED_IDENTIFIERS.add(SANITY_QUERIES.name)
RESERVED_IDENTIFIERS.add(ALL_SANITY_SCHEMA_TYPES.name)
RESERVED_IDENTIFIERS.add(INTERNAL_REFERENCE_SYMBOL.name)
RESERVED_IDENTIFIERS.add(ARRAY_OF.name)
