import {type SchemaType} from '@sanity/types'

/**
 * Checks if an object type is anonymous (has no explicit `name` property in the schema definition).
 *
 * Anonymous objects are inline object definitions without a `name`, e.g.:
 * ```ts
 * { type: 'object', fields: [...] }  // anonymous - no name
 * ```
 *
 * vs named objects:
 * ```ts
 * { type: 'object', name: 'myType', fields: [...] }  // named
 * ```
 *
 * We check `_internal_ownProps` to see if `name` was explicitly provided in the original
 * schema definition, not just inherited from the base type.
 *
 * @param schemaType - The schema type to check
 * @returns `true` if the object is anonymous, `false` otherwise
 */
export function isAnonymousObject(schemaType: SchemaType): boolean {
  const ownProps = (schemaType as {_internal_ownProps?: Record<string, unknown>})._internal_ownProps
  const isBaseObjectType = schemaType.type?.name === 'object'
  const hasExplicitName = ownProps && 'name' in ownProps
  return isBaseObjectType && !hasExplicitName
}
