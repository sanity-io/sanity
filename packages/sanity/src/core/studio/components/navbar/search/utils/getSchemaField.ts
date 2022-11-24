import {isObjectSchemaType, ObjectField, SchemaType} from '@sanity/types'

export function getSchemaField(
  schemaType: SchemaType,
  fieldPath: string
): ObjectField<SchemaType> | undefined {
  const paths = fieldPath.split('.')
  const firstPath = paths[0]
  if (firstPath && isObjectSchemaType(schemaType)) {
    const field = schemaType.fields.find((f) => f.name === firstPath)
    if (field) {
      const nextPath = paths.slice(1).join('.')
      if (nextPath) {
        return getSchemaField(field.type, nextPath)
      }
      return field
    }
  }
  return undefined
}
