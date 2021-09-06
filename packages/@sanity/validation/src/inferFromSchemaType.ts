import {Schema, SchemaType} from '@sanity/types'
import normalizeValidationRules from './util/normalizeValidationRules'

function traverse(typeDef: SchemaType, visited: Set<SchemaType>) {
  if (visited.has(typeDef)) {
    return
  }

  visited.add(typeDef)

  typeDef.validation = normalizeValidationRules(typeDef)

  if ('fields' in typeDef) {
    for (const field of typeDef.fields) {
      traverse(field.type, visited)
    }
  }

  if ('of' in typeDef) {
    for (const candidate of typeDef.of) {
      traverse(candidate, visited)
    }
  }

  // eslint-disable-next-line no-warning-comments
  // @ts-expect-error TODO (eventually): `annotations` does not exist on the SchemaType yet
  if (typeDef.annotations) {
    // eslint-disable-next-line no-warning-comments
    // @ts-expect-error TODO (eventually): `annotations` does not exist on the SchemaType yet
    for (const annotation of typeDef.annotations) {
      traverse(annotation, visited)
    }
  }
}

// NOTE: this overload is for TS API compatibility with a previous implementation
function inferFromSchemaType(
  typeDef: SchemaType,
  // these are intentionally unused
  _schema: Schema,
  _visited?: Set<SchemaType>
): SchemaType
// note: this seemingly redundant overload is required
function inferFromSchemaType(typeDef: SchemaType): SchemaType
function inferFromSchemaType(typeDef: SchemaType): SchemaType {
  traverse(typeDef, new Set())
  return typeDef
}

export default inferFromSchemaType
