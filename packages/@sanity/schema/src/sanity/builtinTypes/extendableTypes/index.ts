import releaseMetadata from './releaseMetadata'
import variantMetadata from './variantMetadata'

export interface ExtendableTypeDefinition {
  name: string
  fields: {name: string}[]
}

/**
 * Built-in object types that a schema extends by declaring a type with the same
 * name. The declaration only lists the fields it adds: the core fields of the
 * built-in definition are always prepended, the way object types like `image` prepends its asset
 * fields, and replace a declared field with the same name.
 * The declaration becomes a local type of that schema, replacing the built-in one.
 */
export const extendableTypes: readonly ExtendableTypeDefinition[] = [
  releaseMetadata,
  variantMetadata,
]

export function findExtendableType(typeName: unknown): ExtendableTypeDefinition | undefined {
  return extendableTypes.find((type) => type.name === typeName)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function fieldName(field: unknown): unknown {
  return isRecord(field) ? field.name : undefined
}

function withCoreFields(
  typeDef: Record<string, unknown>,
  extendable: ExtendableTypeDefinition,
): Record<string, unknown> {
  const fields = typeDef.fields ?? []
  if (!Array.isArray(fields)) return typeDef
  const coreFieldNames = new Set<unknown>(extendable.fields.map((field) => field.name))
  const addedFields = fields.filter((field) => !coreFieldNames.has(fieldName(field)))
  return {...typeDef, fields: [...extendable.fields, ...addedFields]}
}

/**
 * Prepends the core fields to the extendable types declared in `types`, so a
 * declaration only has to list the fields it adds. A declared field with a core
 * field's name is replaced by the core field, which is what lets a serialized
 * schema (a manifest or a descriptor) that carries the core fields rebuild the
 * same type. Other types are returned as they are.
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
