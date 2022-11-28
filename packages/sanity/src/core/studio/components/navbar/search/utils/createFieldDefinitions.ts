import {
  ArrayDefinition,
  ObjectDefinition,
  Schema,
  SchemaTypeDefinition,
  StringDefinition,
} from '@sanity/types'
import startCase from 'lodash/startCase'
import {Md5} from 'ts-md5'
import {getSupportedFieldTypes, SearchFilterDefinition} from '../definitions/filters'
import type {SearchFieldDefinition} from '../types'
import {getSearchableOmnisearchTypes} from './selectors'

const MAX_OBJECT_DEPTH = 4

export function createFieldDefinitions(
  schema: Schema,
  filterDefinitions: SearchFilterDefinition[]
): SearchFieldDefinition[] {
  // Get document types from current schema
  const originalSchema = schema._original
  const documentTypes: ObjectDefinition[] = []
  const objectTypes: Record<string, ObjectDefinition> = {}

  const searchableDocumentTypeNames = getSearchableOmnisearchTypes(schema).map((s) => s.name)

  // Separate documents and everything else
  originalSchema?.types
    // Ignore document types hidden with `__experimental_omnisearch_visibility: false`
    .filter((schemaType) => searchableDocumentTypeNames.includes(schemaType.name))
    // Ignore the special 'slug' object, this is to prevent surfacing the 'current'
    // and (now deprecated) 'Source field' fields.
    .filter((schemaType) => schemaType.name !== 'slug')
    // Ignore sanity documents and assets
    .filter((schemaType) => !schemaType.name.startsWith('sanity.'))
    .forEach((schemaType) => {
      if (isDocumentType(schemaType)) {
        documentTypes.push(schemaType)
      } else {
        objectTypes[schemaType.name] = schemaType as ObjectDefinition
      }
    })

  // Get supported filter field types
  const supportedFieldTypes = getSupportedFieldTypes(filterDefinitions)

  // Recursively iterate through all documents and resolve objects
  return getDocumentFieldDefinitions(supportedFieldTypes, documentTypes, objectTypes)
}

function getDocumentFieldDefinitions(
  supportedFieldTypes: string[],
  documentTypes: ObjectDefinition[],
  objectTypes: Record<string, ObjectDefinition>
) {
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
    const isObject = isObjectDefinition(defType)
    const continueRecursion = depth < MAX_OBJECT_DEPTH
    const isInternalField = defType.name.startsWith('_')
    const title = defType?.title || startCase(defType.name)
    const fieldPath = prevFieldPath ? `${prevFieldPath}.${defType.name}` : defType.name
    const titlePath = prevTitlePath ? [...prevTitlePath, title] : [title]

    if (!continueRecursion) {
      return
    }

    // Check if current field can be mapped to an existing object
    // defined in our schema, or if it's an inline object
    const existingObject = objectTypes[defType.type]
    if (existingObject || isObject) {
      const targetObject = existingObject || defType
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

    // Fail early if the current field type isn't supported
    if (!supportedFieldTypes.includes(defType.type)) return

    acc.push({
      documentTypes: documentType && !isInternalField ? [documentType] : [],
      fieldPath,
      filterType: resolveFilterType(defType),
      id: '',
      name: defType.name,
      titlePath,
      title,
      type: defType.type,
    })
  }

  const fieldDefinitions = documentTypes
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
    id: Md5.hashStr(
      JSON.stringify([field.documentTypes, field.fieldPath, field.filterType, field.type])
    ),
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

function isDocumentType(schemaType: SchemaTypeDefinition): schemaType is ObjectDefinition {
  return schemaType.type === 'document'
}

function isObjectDefinition(schemaType: SchemaTypeDefinition): schemaType is ObjectDefinition {
  return schemaType.type === 'object'
}

function isStringDefinition(schemaType: SchemaTypeDefinition): schemaType is StringDefinition {
  return schemaType.type === 'string'
}

function isStringList(schemaType: SchemaTypeDefinition): schemaType is StringDefinition {
  if (isStringDefinition(schemaType)) {
    return schemaType.options?.list ? schemaType.options.list.length > 0 : false
  }
  return false
}

function resolveFilterType(schemaType: SchemaTypeDefinition) {
  if (isStringList(schemaType)) {
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
