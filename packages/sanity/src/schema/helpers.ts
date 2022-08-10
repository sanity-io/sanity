import type {SchemaType} from '@sanity/types'

/**
 * Get the most specific defined title of a schema type
 * If not set directly on the given type, it will traverse up the tree until it
 * finds one, falling back to the _name_ of the type.
 *
 * @param type - The schema type to get the title of
 * @returns A title, alternatively the schema type _name_
 * @internal
 */
export function getSchemaTypeTitle(type: SchemaType): string {
  if (typeof type.title === 'string') {
    return type.title
  }

  if (type.type) {
    return getSchemaTypeTitle(type.type)
  }

  return type.name || type.jsonType
}
