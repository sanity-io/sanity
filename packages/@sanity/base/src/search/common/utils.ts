import {ObjectSchemaType, SchemaType} from '@sanity/types'

const isDocumentType = (type: SchemaType): type is ObjectSchemaType =>
  type.type && type.type.name === 'document'

const isSanityType = (type: SchemaType): boolean => type.name.startsWith('sanity.')

export const getSearchableTypes = (schema: {
  get: (typeName: string) => SchemaType | undefined
  getTypeNames(): string[]
}): ObjectSchemaType[] =>
  schema
    .getTypeNames()
    .map((typeName) => schema.get(typeName))
    .filter(isDocumentType)
    .filter((type) => !isSanityType(type))
