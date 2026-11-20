import {findExtendableType} from '@sanity/schema/_internal'
import {type ObjectDefinition} from '@sanity/types'

/**
 * A schema's version of an extendable built-in type, without the `name` and
 * `type` that {@link extendBuiltinType} sets. `fields` lists only the fields it
 * adds.
 *
 * @internal
 */
export type ExtendBuiltinTypeDefinition = Omit<ObjectDefinition, 'name' | 'type' | 'fields'> & {
  fields?: ObjectDefinition['fields']
}

/**
 * Declares a schema's version of the extendable built-in type `name`. The core
 * fields of the built-in type are added when the schema is created, and
 * declaring one throws, since the schema would silently use the built-in field
 * instead.
 *
 * @internal
 */
export function extendBuiltinType<const TName extends string>(
  name: TName,
  definition: ExtendBuiltinTypeDefinition,
): ObjectDefinition & {name: TName} {
  const coreFieldNames = findExtendableType(name)?.fields.map((field) => field.name) ?? []
  const redeclared = (definition.fields ?? [])
    .map((field) => field.name)
    .filter((fieldName) => coreFieldNames.includes(fieldName))
  if (redeclared.length > 0) {
    throw new Error(
      `Can't declare \`${redeclared.join('`, `')}\` on \`${name}\`. Its core fields (\`${coreFieldNames.join('`, `')}\`) are always included, so only list the fields you add.`,
    )
  }
  return {fields: [], ...definition, name, type: 'object'}
}
