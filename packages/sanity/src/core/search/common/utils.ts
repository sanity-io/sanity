import {ObjectSchemaType, Schema, SchemaType} from '@sanity/types'
import {isNonNullable} from '../../util/isNonNullable'

const isDocumentType = (type: SchemaType): type is ObjectSchemaType =>
  Boolean(type.type && type.type.name === 'document')

const isSanityType = (type: SchemaType): boolean => type.name.startsWith('sanity.')

export const getSearchableTypes = (schema: Schema): ObjectSchemaType[] =>
  schema
    .getTypeNames()
    .map((typeName) => schema.get(typeName))
    .filter(isNonNullable)
    .filter((schemaType) => isDocumentType(schemaType))
    .filter((type) => !isSanityType(type)) as ObjectSchemaType[]
