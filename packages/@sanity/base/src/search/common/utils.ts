import {ObjectSchemaType, Schema, SchemaType} from '@sanity/types'

const isDocumentType = (type: SchemaType): type is ObjectSchemaType =>
  type.type && type.type.name === 'document'

const isSanityType = (type: SchemaType): boolean => type.name.startsWith('sanity.')

const isSearchable = (type: ObjectSchemaType): boolean => type.__experimental_search_ignore !== true

export const getSearchableTypes = (
  schema: Schema
  // eslint-disable-next-line camelcase
): {name: string; __experimental_search: ObjectSchemaType['__experimental_search']}[] =>
  schema
    .getTypeNames()
    .map((typeName) => schema.get(typeName))
    .filter(isDocumentType)
    .filter((type) => !isSanityType(type))
    .filter(isSearchable)
