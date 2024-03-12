import {type ObjectSchemaType, type Schema, type SchemaType} from '@sanity/types'

import {isNonNullable} from '../../util/isNonNullable'

const isDocumentType = (type: SchemaType): type is ObjectSchemaType =>
  Boolean(type.type && type.type.name === 'document')

const isIgnoredType = (type: SchemaType): boolean =>
  type.name.startsWith('sanity.') && type.name !== 'sanity.previewUrlSecret'

/**
 * @internal
 */
export const getSearchableTypes = (schema: Schema): ObjectSchemaType[] =>
  schema
    .getTypeNames()
    .map((typeName) => schema.get(typeName))
    .filter(isNonNullable)
    .filter(isDocumentType)
    .filter((type) => !isIgnoredType(type))
