import type {
  DocumentDefinition,
  ObjectDefinition,
  Schema,
  SchemaTypeDefinition,
} from '@sanity/types'
import {startCase} from 'lodash'
import {getSupportedFieldTypes} from '../definitions/filters'

export interface MappedSchemaObject {
  documentTypes: string[]
  fields?: MappedSchemaObject[]
  fieldPath: string
  name: string
  path: string[]
  title: string
  type: string
}

const MAX_OBJECT_DEPTH = 4

export function getSchemaFields(schema: Schema): MappedSchemaObject[] {
  // Get document types from current schema
  const originalSchema = schema._original
  const documentTypes: ObjectDefinition[] = []
  const objectTypes: Record<string, ObjectDefinition> = {}

  // Get supported filter field types
  const supportedFieldTypes = getSupportedFieldTypes()

  // Separate documents and everything else
  originalSchema?.types
    .filter((schemaType) => !schemaType.name.startsWith('sanity.'))
    .forEach((schemaType) => {
      if (isDocumentType(schemaType)) {
        documentTypes.push(schemaType)
      }
      objectTypes[schemaType.name] = schemaType as ObjectDefinition
    })

  // 1. Recursively iterate through all documents and resolve objects
  const mappedDocuments = mapDocumentTypesRecursive(documentTypes, objectTypes)

  // 2. Try flatten fields
  const flattened = flattenFieldsByKey(mappedDocuments, 'fields').filter(
    (doc) => !['crossDatasetReference', 'document', 'object'].includes(doc.type)
  )

  // 3. Flatten with document types
  const flattenedWithDocumentTypes = flattened
    .reduce<MappedSchemaObject[]>((acc, val) => {
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
    // TODO: Filter out hidden fields

    // Filter out non-recognised field types and hidden types
    .filter((schemaType) => supportedFieldTypes.includes(schemaType.type))

    .sort((a, b) => {
      const aTitle = a.path[a.path.length - 1]
      const bTitle = b.path[b.path.length - 1]
      if (aTitle === bTitle) {
        return (
          a.path.slice(0, -1).join(',').localeCompare(b.path.slice(0, -1).join(',')) ||
          a.fieldPath.localeCompare(b.fieldPath)
        )
      }
      return aTitle.localeCompare(bTitle)
    })

  // console.log('documentTypes', documentTypes)
  // console.log('objectTypes', objectTypes)
  // console.log('1. mappedDocuments', mappedDocuments)
  // console.log('2. flattened', flattened)
  // console.log('3. flattenedWithDocumentTypes', flattenedWithDocumentTypes)

  return flattenedWithDocumentTypes
}

function flattenFieldsByKey(data: MappedSchemaObject[], key: string, depth = 0) {
  return data?.reduce<MappedSchemaObject[]>((acc, val) => {
    if (depth > 0) {
      acc.push(val)
    }
    if (val.fields) {
      acc.push(...flattenFieldsByKey(val.fields, key, depth + 1))
    }
    return acc
  }, [])
}

function isDocumentDefinition(defType: SchemaTypeDefinition): defType is DocumentDefinition {
  return defType.type === 'document'
}

function isDocumentType(schemaType: SchemaTypeDefinition): schemaType is ObjectDefinition {
  return schemaType.type === 'document'
}

function isObjectDefinition(defType: SchemaTypeDefinition): defType is ObjectDefinition {
  return defType.type === 'object'
}

function mapDocumentTypesRecursive(
  documentTypes: ObjectDefinition[],
  objectTypes: Record<string, ObjectDefinition>
) {
  function mapSchemaTypeFields(
    defType: SchemaTypeDefinition,
    depth = 0,
    prevFieldPath: string | null = null,
    prevPath: string[] = [],
    documentType?: string
  ): MappedSchemaObject {
    const docType = isDocumentDefinition(defType) ? defType.name : documentType
    const continueRecursion = depth < MAX_OBJECT_DEPTH

    return {
      documentTypes: docType ? [docType] : [],
      fieldPath: prevFieldPath ?? '',
      name: defType.name,
      path: prevPath ?? [],
      title: defType?.title || startCase(defType.name),
      type: defType.type,
      // Fields
      // TODO: refactor
      ...((isObjectDefinition(defType) || isDocumentDefinition(defType)) &&
        continueRecursion && {
          fields: defType.fields.map((field) => {
            const existingObject = objectTypes[field.type]
            const fieldTitle = field?.title || startCase(field.name)
            const fieldPath = prevFieldPath ? `${prevFieldPath}.${field.name}` : field.name
            const path = prevPath ? [...prevPath, fieldTitle] : [fieldTitle]

            return {
              ...mapSchemaTypeFields(
                existingObject
                  ? {
                      ...existingObject,
                      name: field.name,
                    }
                  : (field as ObjectDefinition),
                depth + 1,
                fieldPath,
                path,
                docType
              ),
            }
          }),
        }),
    }
  }

  return documentTypes.map((t) => mapSchemaTypeFields(t))
}
