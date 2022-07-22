import {ObjectSchemaType, SchemaType} from '@sanity/types'

/**
 * Returns a list of all available document types filtered by a search string.
 * Types containing the search string in its `title` or `name` will be returned.
 */
export function getSelectableTypes(
  schema: {
    get: (typeName: string) => SchemaType | undefined
    getTypeNames(): string[]
  },
  // selectedTypes: SchemaType[],
  typeFilter: string
): ObjectSchemaType[] {
  return (
    schema
      .getTypeNames()
      .map((n) => schema.get(n))
      .filter((s): s is ObjectSchemaType => s && s.jsonType === 'object')
      .filter((s) => getRootType(s)?.name === 'document' && s.name !== 'document')
      //.filter((s) => !selectedTypes.includes(s))
      .filter(
        (t) => !typeFilter || (t.title ?? t.name).toLowerCase().includes(typeFilter?.toLowerCase())
      )
      .sort(sortTypes)
  )
}

function getRootType(type: SchemaType): SchemaType {
  if (!type.type) {
    return type
  }
  return getRootType(type.type)
}

export function sortTypes(a: SchemaType, b: SchemaType): number {
  return (a.title ?? a.name).localeCompare(b.title ?? b.name)
}
