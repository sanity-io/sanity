import {type ObjectSchemaType, type Schema, type SchemaType} from '@sanity/types'

import {isNonNullable} from '../../util/isNonNullable'

const isDocumentType = (type: SchemaType): type is ObjectSchemaType =>
  Boolean(type.type && type.type.name === 'document')

const isObjectType = (type: SchemaType): type is ObjectSchemaType => type.jsonType === 'object'

const isIgnoredType = (type: SchemaType): boolean =>
  type.name.startsWith('sanity.') && type.name !== 'sanity.previewUrlSecret'

/**
 * Get all defined document types from the schema that are searchable
 *
 * @param schema - The schema to get searchable types from
 * @param explicitlyAllowedTypes - Array of type names to explicitly allow, even if they are otherwise ignored. This is useful for cases where you want to allow say `sanity.imageAsset` explicitly, or an object type that was _previously_ defined as a document type, and thus still have documents.
 *
 * @internal
 */
export const getSearchableTypes = (
  schema: Schema,
  explicitlyAllowedTypes: string[] = [],
): ObjectSchemaType[] =>
  schema
    .getTypeNames()
    .map((typeName) => schema.get(typeName))
    .filter(isNonNullable)
    .filter(
      (type) =>
        (isDocumentType(type) && !isIgnoredType(type)) ||
        explicitlyAllowedTypes.includes(type.name),
    )
    .filter(isObjectType)
