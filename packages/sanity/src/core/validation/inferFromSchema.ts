import type {Schema} from '@sanity/types'
import {inferFromSchemaType} from './inferFromSchemaType'

// Note: Mutates schema. Refactor when @sanity/schema supports middlewares
export function inferFromSchema(schema: Schema): Schema {
  const typeNames = schema.getTypeNames()

  typeNames.forEach((typeName) => {
    const schemaType = schema.get(typeName)

    if (schemaType) {
      inferFromSchemaType(schemaType)
    }
  })

  return schema
}
