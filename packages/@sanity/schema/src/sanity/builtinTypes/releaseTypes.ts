import releaseDocument from './release'
import releaseMetadata, {
  RELEASE_METADATA_TYPE_NAME,
  releaseMetadataCoreFields,
} from './releaseMetadata'

export {RELEASE_DOCUMENT_TYPE_NAME} from './release'
export {RELEASE_METADATA_TYPE_NAME, releaseMetadataCoreFieldNames} from './releaseMetadata'

/**
 * The release document type and its default metadata type. These are compiled
 * as local types of each Studio schema rather than as part of the built-in
 * parent schema, so a schema can replace `sanity.releaseMetadata`.
 */
export const defaultReleaseTypes = [releaseDocument, releaseMetadata]

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function fieldName(field: unknown): unknown {
  return isRecord(field) ? field.name : undefined
}

function withCoreFields(typeDef: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(typeDef.fields)) return typeDef
  const declared = new Set(typeDef.fields.map(fieldName))
  const missing = releaseMetadataCoreFields.filter((field) => !declared.has(field.name))
  if (missing.length === 0) return typeDef
  return {...typeDef, fields: [...missing, ...typeDef.fields]}
}

/**
 * Adds the release types to a list of schema type definitions.
 *
 * A `sanity.releaseMetadata` definition in `types` replaces the default one.
 * Core fields it does not declare are prepended, so it only has to list the
 * fields it adds or customizes. The metadata type is moved last so the types it
 * refers to are visited before it during schema validation.
 */
export function resolveReleaseTypes(types: unknown[]): unknown[] {
  const custom = types.find(
    (typeDef) => isRecord(typeDef) && typeDef.name === RELEASE_METADATA_TYPE_NAME,
  )
  if (!isRecord(custom)) {
    return [...types, ...defaultReleaseTypes]
  }
  return [...types.filter((typeDef) => typeDef !== custom), releaseDocument, withCoreFields(custom)]
}
