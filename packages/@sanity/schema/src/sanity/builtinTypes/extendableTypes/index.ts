import releaseMetadata from './releaseMetadata'

export interface ExtendableTypeDefinition {
  name: string
  fields: {name: string}[]
}

/**
 * Built-in object types that a schema extends by declaring a type with the same
 * name. The declaration only lists the fields it adds: the core fields of the
 * built-in definition are always prepended, the way object types like `image` prepends its asset
 * fields, and schema validation rejects a declaration that redeclares one.
 * The declaration becomes a local type of that schema, replacing the built-in one.
 */
export const extendableTypes: readonly ExtendableTypeDefinition[] = [releaseMetadata]

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
 * Prepends the core fields to the extendable types declared in `types`, so a
 * declaration only has to list the fields it adds. Other types are returned as
 * they are.
 */
export function resolveExtendableTypes(types: unknown[]): unknown[] {
  const declared = new Set<string>()
  return types.map((typeDef) => {
    const extendable = isRecord(typeDef) ? findExtendableType(typeDef.name) : undefined
    if (!isRecord(typeDef) || !extendable || declared.has(extendable.name)) return typeDef
    declared.add(extendable.name)
    return withCoreFields(typeDef, extendable)
  })
}
