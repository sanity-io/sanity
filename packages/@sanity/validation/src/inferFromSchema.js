import inferFromSchemaType from './inferFromSchemaType'

// Note: Mutates schema. Refactor when @sanity/schema supports middlewares
function inferFromSchema(schema) {
  const typeNames = schema.getTypeNames()
  typeNames.forEach((typeName) => {
    inferFromSchemaType(schema.get(typeName), schema)
  })
  return schema
}

export default inferFromSchema
