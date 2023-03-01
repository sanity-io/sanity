import {
  ArrayDefinition,
  ObjectDefinition,
  Schema,
  SchemaTypeDefinition,
  StringDefinition,
} from '@sanity/types'
import startCase from 'lodash/startCase'
import {sanitizeFieldValue} from '../utils/sanitizeField'
import {getSearchableOmnisearchTypes} from '../utils/selectors'
import {getSupportedFieldTypes, SearchFilterDefinition} from './filters'

export const MAX_OBJECT_TRAVERSAL_DEPTH = 3

/**
 * @internal
 */
export interface SearchFieldDefinition {
  documentTypes: string[]
  fieldPath: string
  filterName: string
  id: string
  name: string
  title: string
  titlePath: string[]
  type: string
}

/**
 * @internal
 */
export type SearchFieldDefinitionDictionary = Record<
  SearchFieldDefinition['id'],
  SearchFieldDefinition
>

export function createFieldDefinitions(
  schema: Schema,
  filterDefinitions: SearchFilterDefinition[]
): SearchFieldDefinition[] {
  // Get allowed document types (`__experimental_omnisearch_visibility !== false`)
  const searchableDocumentTypeNames = getSearchableOmnisearchTypes(schema).map((s) => s.name)

  // Get user-defined schema types, partitioned into documents and objects
  const {documentTypes, objectTypes} = (schema._original?.types || [])
    // Ignore document types hidden by omnisearch
    .filter((t) =>
      isDocumentObjectDefinition(t) ? searchableDocumentTypeNames.includes(t.name) : true
    )
    // Ignore the 'slug' object to prevent surfacing 'current' and (deprecated) 'source field' fields.
    .filter((schemaType) => schemaType.name !== 'slug')
    // Ignore sanity documents and assets
    .filter((schemaType) => !schemaType.name.startsWith('sanity.'))
    // Partition
    .reduce<{
      documentTypes: Record<string, ObjectDefinition>
      objectTypes: Record<string, ObjectDefinition>
    }>(
      (acc, schemaType) => {
        if (isDocumentObjectDefinition(schemaType)) {
          acc.documentTypes[schemaType.name] = schemaType
        }
        if (isObjectDefinition(schemaType)) {
          acc.objectTypes[schemaType.name] = schemaType as ObjectDefinition
        }
        return acc
      },
      {documentTypes: {}, objectTypes: {}}
    ) || {documentTypes: {}, objectTypes: {}}

  // Get supported filter field types that have corresponding filters defined
  const supportedFieldTypes = getSupportedFieldTypes(filterDefinitions)

  return getDocumentFieldDefinitions(supportedFieldTypes, documentTypes, objectTypes)
}

export function createFieldDefinitionDictionary(
  fieldDefinitions: SearchFieldDefinition[]
): SearchFieldDefinitionDictionary {
  return fieldDefinitions.reduce<SearchFieldDefinitionDictionary>((acc, val) => {
    acc[val.id] = val
    return acc
  }, {})
}

export function generateFieldId(field: SearchFieldDefinition): string {
  return [field.type, field.fieldPath, field.filterName, field.documentTypes.join(',')].join('-')
}

function getDocumentFieldDefinitions(
  supportedFieldTypes: string[],
  documentTypes: Record<string, ObjectDefinition>,
  objectTypes: Record<string, ObjectDefinition>
) {
  // Recursively iterate through all documents and resolve objects
  function addFieldDefinitionRecursive({
    acc,
    defType,
    depth = 0,
    documentType,
    prevFieldPath,
    prevTitlePath,
  }: {
    acc: SearchFieldDefinition[]
    defType: SchemaTypeDefinition
    depth?: number
    documentType: string
    prevFieldPath?: string
    prevTitlePath?: string[]
  }) {
    const continueRecursion = depth <= MAX_OBJECT_TRAVERSAL_DEPTH
    const isInternalField = defType.name.startsWith('_')
    // Sanitize schema titles (which may either be a string or React element)
    const title = defType?.title ? sanitizeFieldValue(defType.title) : startCase(defType.name)
    const fieldPath = prevFieldPath ? `${prevFieldPath}.${defType.name}` : defType.name
    const titlePath = prevTitlePath ? [...prevTitlePath, title] : [title]

    if (!continueRecursion) return

    // Map to an existing document, object or inline object if found
    const existingObject = objectTypes[defType.type]
    const existingDocument = documentTypes[defType.type]
    const inlineObject = isObjectDefinition(defType) ? defType : null
    const targetObject = existingDocument || existingObject || inlineObject

    if (targetObject) {
      targetObject?.fields?.forEach((field) =>
        addFieldDefinitionRecursive({
          acc,
          defType: field as ObjectDefinition,
          depth: depth + 1,
          documentType,
          prevFieldPath: fieldPath,
          prevTitlePath: titlePath,
        })
      )
      return
    }

    // Return if the current field type doesn't have a corresponding filter
    if (!supportedFieldTypes.includes(defType.type)) return

    acc.push({
      documentTypes: documentType && !isInternalField ? [documentType] : [],
      fieldPath,
      filterName: resolveFilterName(defType),
      id: '',
      name: defType.name,
      titlePath,
      title,
      type: defType.type,
    })
  }

  const fieldDefinitions = Object.values(documentTypes)
    .reduce<SearchFieldDefinition[]>((acc, documentType) => {
      const documentFields = (documentType.fields as ObjectDefinition[]).reduce<
        SearchFieldDefinition[]
      >((a, field) => {
        addFieldDefinitionRecursive({acc: a, defType: field, documentType: documentType.name})
        return a
      }, [])
      acc.push(...documentFields)
      return acc
    }, [])
    .reduce<SearchFieldDefinition[]>((acc, val) => {
      const prevIndex = acc.findIndex(
        (v) => v.fieldPath === val.fieldPath && v.title === val.title && v.type === val.type
      )
      if (prevIndex > -1) {
        acc[prevIndex] = {
          ...acc[prevIndex],
          documentTypes: [...acc[prevIndex].documentTypes, ...val.documentTypes],
        }
      } else {
        acc.push(val)
      }
      return acc
    }, [])
    .map(addFieldDefinitionId)
    .sort(sortFieldDefinitions)

  return fieldDefinitions
}

/**
 * Create unique ID as a hash from documentTypes, full field path, filter and field types
 */
function addFieldDefinitionId(field: SearchFieldDefinition) {
  return {
    ...field,
    id: generateFieldId(field),
  }
}

function isArrayOfPrimitives(schemaType: SchemaTypeDefinition): schemaType is ArrayDefinition {
  if (isArrayDefinition(schemaType)) {
    return (
      schemaType.of.every((item) => ['boolean', 'number', 'string'].includes(item.type)) &&
      (schemaType.options?.list ? schemaType.options.list.length > 0 : false)
    )
  }
  return false
}

function isArrayDefinition(schemaType: SchemaTypeDefinition): schemaType is ArrayDefinition {
  return schemaType.type === 'array'
}

function isDocumentObjectDefinition(
  schemaType: SchemaTypeDefinition
): schemaType is ObjectDefinition {
  return schemaType.type === 'document'
}

function isObjectDefinition(schemaType: SchemaTypeDefinition): schemaType is ObjectDefinition {
  return schemaType.type === 'object'
}

function isStringDefinition(schemaType: SchemaTypeDefinition): schemaType is StringDefinition {
  return schemaType.type === 'string'
}

function isStringListDefinition(schemaType: SchemaTypeDefinition): schemaType is StringDefinition {
  if (isStringDefinition(schemaType)) {
    return schemaType.options?.list ? schemaType.options.list.length > 0 : false
  }
  return false
}

function resolveFilterName(schemaType: SchemaTypeDefinition) {
  if (isStringListDefinition(schemaType)) {
    return 'stringList'
  }
  if (isArrayDefinition(schemaType)) {
    if (schemaType.of.some((item) => item.type === 'reference')) {
      return 'arrayReferences'
    }
    if (schemaType.of.find((item) => item.type === 'block')) {
      return 'portableText'
    }
    if (isArrayOfPrimitives(schemaType)) {
      return 'arrayList'
    }
  }
  return schemaType.type
}

/**
 * Sort definitions by title, joined titlePath and fieldPath (in that order)
 */
function sortFieldDefinitions(a: SearchFieldDefinition, b: SearchFieldDefinition): number {
  const aTitlePath = a.titlePath.slice(0, -1).join('/')
  const bTitlePath = b.titlePath.slice(0, -1).join('/')
  return (
    a.title.localeCompare(b.title) ||
    aTitlePath.localeCompare(bTitlePath) ||
    a.fieldPath.localeCompare(b.fieldPath)
  )
}
