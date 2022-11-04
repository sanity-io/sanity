import type {
  DocumentDefinition,
  ObjectDefinition,
  Schema,
  SchemaTypeDefinition,
} from '@sanity/types'
import {startCase} from 'lodash'
import {FILTERS} from '../definitions/filters'
import type {SupportedFieldType} from '../definitions/filters/types'

export interface MappedSchemaObject {
  documentTypes: string[]
  fields?: MappedSchemaObject[]
  fieldPath: string
  name: string
  path: string[]
  title: string // created if missing
  // type: keyof IntrinsicDefinitions
  type: SupportedFieldType
}

const MAX_OBJECT_DEPTH = 4

function isDocumentType(schemaType: SchemaTypeDefinition): schemaType is ObjectDefinition {
  return schemaType.type === 'document'
}

export function getSchemaFields(schema: Schema): MappedSchemaObject[] {
  // Get document types
  const originalSchema = schema._original
  const documentTypes: ObjectDefinition[] = []
  const objectTypes: Record<string, ObjectDefinition> = {}

  // Separate documents and everything else
  originalSchema?.types
    .filter((schemaType) => !schemaType.name.startsWith('sanity.'))
    .forEach((schemaType) => {
      if (isDocumentType(schemaType)) {
        documentTypes.push(schemaType)
      }
      objectTypes[schemaType.name] = schemaType as ObjectDefinition
    })

  // TODO: update, these can contain pretty much anything

  function isDocumentDefinition(defType: SchemaTypeDefinition): defType is DocumentDefinition {
    return defType.type === 'document'
  }

  function isObjectDefinition(defType: SchemaTypeDefinition): defType is ObjectDefinition {
    return defType.type === 'object'
  }

  function mapSchemaTypeFields(
    defType: SchemaTypeDefinition,
    depth = 0,
    prevFieldPath: string | null = null,
    prevPath: string[] = [],
    documentType?: string
  ): MappedSchemaObject {
    // TODO: refactor
    const docType = isDocumentDefinition(defType) ? defType.name : documentType
    const renderFields = depth < MAX_OBJECT_DEPTH // render fields
    return {
      documentTypes: [docType as SupportedFieldType],
      name: defType.name,
      fieldPath: prevFieldPath ?? '',
      path: prevPath ?? [],
      // TODO: if title is missing, should we mark a separate boolean?
      title: defType?.title || startCase(defType.name),
      // TODO: refactor
      type: defType.type as SupportedFieldType,
      // Fields
      // TODO: refactor
      ...((isObjectDefinition(defType) || isDocumentDefinition(defType)) &&
        renderFields && {
          fields: defType.fields.map((field) => {
            const fieldTitle = field?.title || startCase(field.name)

            const existingObject = objectTypes[field.type]
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

  // 1. Recursively iterate through all documents and resolve objects
  const mappedDocuments = documentTypes.map((t) => mapSchemaTypeFields(t))

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
    .filter((schemaType) => Object.keys(FILTERS.field).includes(schemaType.type))
    // .sort((a, b) => a.path.join(',').localeCompare(b.path.join(',')))
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

  // 4. fields by path
  /*
  const fieldsByPath = flattenedWithDocumentTypes.reduce<Record<string, MappedSchemaObject[]>>(
    (acc, val) => {
      acc[val.fieldPath] = [
        ...(acc[val.fieldPath] || []), //
        val,
      ]
      return acc
    },
    {}
  )
  */

  // console.log('documentTypes', documentTypes)
  // console.log('objectTypes', objectTypes)
  // console.log('1. mappedDocuments', mappedDocuments)
  // console.log('2. flattened', flattened)
  // console.log('3. flattenedWithDocumentTypes', flattenedWithDocumentTypes)
  // console.log('4. fieldsByPath', fieldsByPath)

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
