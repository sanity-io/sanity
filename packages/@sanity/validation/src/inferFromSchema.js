const inferFromSchemaType = require('./inferFromSchemaType')

// Note: Mutates schema. Refactor when @sanity/schema supports middlewares
function inferFromSchema(schema) {
  const typeNames = schema.getTypeNames()
  typeNames.forEach(typeName => {
    inferFromSchemaType(schema.get(typeName), schema)
  })
  return schema
}

module.exports = inferFromSchema
