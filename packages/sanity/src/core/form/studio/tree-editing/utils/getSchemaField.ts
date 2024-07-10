import {isObjectSchemaType, type ObjectField, type SchemaType} from '@sanity/types'
import {fromString, toString} from '@sanity/util/paths'

export function getSchemaField(
  schemaType: SchemaType,
  fieldPath: string,
): ObjectField<SchemaType> | undefined {
  if (!fieldPath) return undefined

  const paths = fromString(fieldPath)
  const firstPath = paths[0]

  if (firstPath && isObjectSchemaType(schemaType)) {
    const field = schemaType?.fields?.find((f) => f.name === firstPath)

    if (field) {
      const nextPath = toString(paths.slice(1))

      if (nextPath) {
        return getSchemaField(field.type, nextPath)
      }

      return field
    }
  }

  return undefined
}
