import {isObjectSchemaType, ObjectField, SchemaType} from '@sanity/types'

export function getSchemaField(
  schemaType: SchemaType,
  fieldPath: string
  // paths: string[]
): ObjectField<SchemaType> | undefined {
  const paths = fieldPath.split('.')
  const firstPath = paths[0]
  if (firstPath) {
    if (isObjectSchemaType(schemaType)) {
      const field = schemaType.fields.find((f) => f.name === firstPath)
      if (field) {
        if (isObjectSchemaType(field)) {
          return getSchemaField(field, paths.slice(1).join('.'))
        }
        return field
      }
    }
  }
  return undefined
}
