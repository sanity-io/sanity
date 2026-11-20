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
  const fields = typeDef.fields ?? []
  if (!Array.isArray(fields)) return typeDef
  const declared = new Set(fields.map(fieldName))
  const missing = releaseMetadataCoreFields.filter((field) => !declared.has(field.name))
  return {...typeDef, fields: [...missing, ...fields]}
}

/**
 * Adds the release types to a list of schema type definitions.
 *
 * A `sanity.releaseMetadata` definition in `types` replaces the default one and
 * only lists the fields it adds: the core fields are prepended, the way `image`
 * prepends its asset fields. Schema validation rejects a definition that
 * declares a core field itself.
 */
export function resolveReleaseTypes(types: unknown[]): unknown[] {
  const custom = types.find(
    (typeDef) => isRecord(typeDef) && typeDef.name === RELEASE_METADATA_TYPE_NAME,
  )
  if (!isRecord(custom)) {
    return [...types, ...defaultReleaseTypes]
  }
  return [
    ...types.map((typeDef) => (typeDef === custom ? withCoreFields(custom) : typeDef)),
    releaseDocument,
  ]
}
