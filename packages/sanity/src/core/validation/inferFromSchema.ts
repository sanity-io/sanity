import {inferFromSchemaType} from './inferFromSchemaType'
import {type Schema} from '@sanity/types'

// Note: Mutates schema. Refactor when @sanity/schema supports middlewares
export function inferFromSchema(schema: Schema): Schema {
  const typeNames = schema.getLocalTypeNames()

  typeNames.forEach((typeName) => {
    const schemaType = schema.get(typeName)

    if (schemaType) {
      inferFromSchemaType(schemaType)
    }
  })

  return schema
}
