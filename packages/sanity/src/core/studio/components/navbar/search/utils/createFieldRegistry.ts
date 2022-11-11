import {
  ArrayDefinition,
  FieldDefinition,
  ObjectDefinition,
  Schema,
  SchemaTypeDefinition,
  StringDefinition,
} from '@sanity/types'
import startCase from 'lodash/startCase'
import {getSupportedFieldTypes, SearchFilterDefinition} from '../definitions/filters'
import type {ResolvedField} from '../types'

// Internal fields to include with every document.
// These fields always appear at the top of the filters list, in the order specified.
export const INTERNAL_FIELDS: FieldDefinition[] = [
  {name: '_updatedAt', title: 'Updated at', type: 'datetime'},
  {name: '_createdAt', title: 'Created at', type: 'datetime'},
]

const MAX_OBJECT_DEPTH = 4
const UNSUPPORTED_TYPES = ['crossDatasetReference', 'document', 'object']

export function createFieldRegistry(
  schema: Schema,
  filterDefinitions: SearchFilterDefinition[]
): ResolvedField[] {
  // Get document types from current schema
  const originalSchema = schema._original
  const documentTypes: ObjectDefinition[] = []
  const objectTypes: Record<string, ObjectDefinition> = {}

  // Get supported filter field types
  const supportedFieldTypes = getSupportedFieldTypes(filterDefinitions)
  // Separate documents and everything else
  originalSchema?.types
    .filter((schemaType) => !schemaType.name.startsWith('sanity.'))
    .forEach((schemaType) => {
      if (isDocumentType(schemaType)) {
        documentTypes.push({
          ...schemaType,
          fields: [...schemaType.fields, ...INTERNAL_FIELDS],
        })
      }
      objectTypes[schemaType.name] = schemaType as ObjectDefinition
    })

  // Recursively iterate through all documents and resolve objects
  const mappedDocuments = mapDocumentTypesRecursive(documentTypes, objectTypes)

  // Flatten fields - remove unsupported types + hidden fields
  const flattened = flattenFieldsByKey(mappedDocuments, 'fields')
    .filter((field) => !UNSUPPORTED_TYPES.includes(field.type))
    .filter((field) => !field.hidden)

  // Flatten with document types
  const flattenedWithDocumentTypes = flattened
    .reduce<ResolvedField[]>((acc, val) => {
      const prevIndex = acc.findIndex((v) => v.fieldPath === val.fieldPath && v.title === val.title)
      if (prevIndex > -1) {
        acc[prevIndex] = {
          ...acc[prevIndex],
          documentTypes: [
            ...acc[prevIndex].documentTypes, //
            ...val.documentTypes,
          ],
        }
      } else {
        acc.push(val)
      }

      return acc
    }, [])
    // Filter out non-recognised field types and hidden fields
    .filter((schemaType) => supportedFieldTypes.includes(schemaType.type))
    // Sort by title, path length and then path title
    .sort((a, b) => {
      const aTitle = a.titlePath[a.titlePath.length - 1]
      const bTitle = b.titlePath[b.titlePath.length - 1]
      if (aTitle === bTitle) {
        return (
          a.titlePath.slice(0, -1).join(',').localeCompare(b.titlePath.slice(0, -1).join(',')) ||
          a.fieldPath.localeCompare(b.fieldPath)
        )
      }
      return aTitle.localeCompare(bTitle)
    })

  return flattenedWithDocumentTypes
}

function flattenFieldsByKey(data: ResolvedField[], key: string, depth = 0) {
  return data?.reduce<ResolvedField[]>((acc, val) => {
    if (depth > 0) {
      acc.push(val)
    }
    if (val.fields) {
      acc.push(...flattenFieldsByKey(val.fields, key, depth + 1))
    }
    return acc
  }, [])
}

function isDocumentType(schemaType: SchemaTypeDefinition): schemaType is ObjectDefinition {
  return schemaType.type === 'document'
}

function isArrayDefinition(schemaType: SchemaTypeDefinition): schemaType is ArrayDefinition {
  return schemaType.type === 'array'
}

function isObjectDefinition(schemaType: SchemaTypeDefinition): schemaType is ObjectDefinition {
  return schemaType.type === 'object'
}

function isStringDefinition(schemaType: SchemaTypeDefinition): schemaType is StringDefinition {
  return schemaType.type === 'string'
}

function mapDocumentTypesRecursive(
  documentTypes: ObjectDefinition[],
  objectTypes: Record<string, ObjectDefinition>
) {
  function mapSchemaTypeFields(
    defType: SchemaTypeDefinition,
    depth = 0,
    prevFieldPath: string | null = null,
    prevTitlePath: string[] = [],
    previousDocumentType?: string
  ): ResolvedField {
    const isDocument = isDocumentType(defType) && objectTypes[defType.name]
    const isObject = isObjectDefinition(defType)

    // Get document type from existing definition (if it exists)
    const documentType = isDocument ? defType.name : previousDocumentType

    const continueRecursion = depth < MAX_OBJECT_DEPTH
    const isInternalField = defType.name.startsWith('_')

    return {
      documentTypes: documentType && !isInternalField ? [documentType] : [],
      fieldPath: prevFieldPath ?? '',
      filterType: resolveFilterType(defType),
      ...(defType?.hidden ? {hidden: defType.hidden} : {}),
      name: defType.name,
      ...(defType?.options ? {options: defType.options} : {}),
      titlePath: prevTitlePath ?? [],
      title: defType?.title || startCase(defType.name),
      type: defType.type,
      // Fields
      ...((isDocument || isObject) &&
        continueRecursion && {
          fields: defType.fields.map((field) => {
            // Check if current field can be mapped to an existing object definition
            const existingObject = objectTypes[field.type]
            const fieldTitle = field?.title || startCase(field.name)
            // Construct the full queryable field path
            const fieldPath = prevFieldPath ? `${prevFieldPath}.${field.name}` : field.name
            // Construct the full title path (used to render field breadcrumbs)
            const titlePath = prevTitlePath ? [...prevTitlePath, fieldTitle] : [fieldTitle]
            // If an existing object has been found, override with current name and continue,
            // otherwise pass through the field as normal.
            const fieldDefType = existingObject
              ? {
                  ...existingObject,
                  name: field.name,
                }
              : (field as ObjectDefinition)

            // Call recursively
            return mapSchemaTypeFields(fieldDefType, depth + 1, fieldPath, titlePath, documentType)
          }),
        }),
    }
  }

  return documentTypes.map((t) => mapSchemaTypeFields(t))
}

function resolveFilterType(schemaType: SchemaTypeDefinition) {
  if (
    isStringDefinition(schemaType) &&
    schemaType.options?.list &&
    schemaType.options.list.length > 0
  ) {
    return 'stringList'
  }
  if (isArrayDefinition(schemaType) && schemaType.of.find((item) => item.type === 'block')) {
    return 'portableText'
  }
  return schemaType.type
}
