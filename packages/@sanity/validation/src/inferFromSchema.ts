import {Schema} from '@sanity/types'
import inferFromSchemaType from './inferFromSchemaType'

// Note: Mutates schema. Refactor when @sanity/schema supports middlewares
function inferFromSchema(schema: Schema): Schema {
  const typeNames = schema.getTypeNames()

  typeNames.forEach((typeName) => {
    const schemaType = schema.get(typeName)

    if (schemaType) {
      inferFromSchemaType(schemaType)
    }
  })

  return schema
}

export default inferFromSchema
