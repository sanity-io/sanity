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
 * fields of the built-in type are added when the schema is created.
 *
 * @internal
 */
export function extendBuiltinType<const TName extends string>(
  name: TName,
  definition: ExtendBuiltinTypeDefinition,
): ObjectDefinition & {name: TName} {
  return {fields: [], ...definition, name, type: 'object'}
}
