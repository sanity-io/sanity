import releaseDocument from './release'
import releaseMetadata from './releaseMetadata'

interface ExtendableTypeDefinition {
  name: string
  fields: {name: string}[]
}

/**
 * Built-in object types that a schema extends by declaring a type with the same
 * name. The declaration only lists the fields it adds: the core fields of the
 * built-in definition are always prepended, the way `image` prepends its asset
 * fields, and schema validation rejects a declaration that redeclares one.
 */
export const extendableTypes: readonly ExtendableTypeDefinition[] = [releaseMetadata]

/**
 * Documents that Content Lake owns and writes through actions. They reference
 * extendable types, so they are compiled with every schema instead of the
 * built-in parent schema: a parent type resolves its field types against the
 * parent and would never see a schema's version of an extendable type. A schema
 * can't declare them.
 */
export const systemDocumentTypes = [releaseDocument]

const systemDocumentTypeNames = new Set<unknown>(systemDocumentTypes.map((type) => type.name))

export function isSystemDocumentTypeName(typeName: unknown): boolean {
  return systemDocumentTypeNames.has(typeName)
}

export function findExtendableType(typeName: unknown): ExtendableTypeDefinition | undefined {
  return extendableTypes.find((type) => type.name === typeName)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function fieldName(field: unknown): unknown {
  return isRecord(field) ? field.name : undefined
}

/**
 * Drops the core fields from a serialized extendable type, so they are added
 * again from the built-in definition.
 */
export function withoutCoreFields(typeDef: unknown): unknown {
  const extendable = isRecord(typeDef) ? findExtendableType(typeDef.name) : undefined
  if (!isRecord(typeDef) || !extendable || !Array.isArray(typeDef.fields)) return typeDef
  const coreFieldNames = new Set<unknown>(extendable.fields.map((field) => field.name))
  return {
    ...typeDef,
    fields: typeDef.fields.filter((field) => !coreFieldNames.has(fieldName(field))),
  }
}

function withCoreFields(
  typeDef: Record<string, unknown>,
  extendable: ExtendableTypeDefinition,
): Record<string, unknown> {
  const fields = typeDef.fields ?? []
  if (!Array.isArray(fields)) return typeDef
  const declared = new Set(fields.map(fieldName))
  const missing = extendable.fields.filter((field) => !declared.has(field.name))
  return {...typeDef, fields: [...missing, ...fields]}
}

/**
 * Adds the extendable types and the system document types to a list of schema
 * type definitions.
 *
 * An extendable type declared in `types` replaces the built-in one, with the
 * core fields prepended. The others are added as built in.
 */
export function resolveExtendableTypes(types: unknown[]): unknown[] {
  const declared = new Set<string>()
  const resolved = types.map((typeDef) => {
    const extendable = isRecord(typeDef) ? findExtendableType(typeDef.name) : undefined
    if (!isRecord(typeDef) || !extendable || declared.has(extendable.name)) return typeDef
    declared.add(extendable.name)
    return withCoreFields(typeDef, extendable)
  })
  return [
    ...resolved,
    ...systemDocumentTypes,
    ...extendableTypes.filter((type) => !declared.has(type.name)),
  ]
}
