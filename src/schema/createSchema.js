import baseSchema from './baseSchema'

const extendTypes = (result, schema) =>
  Object.assign(result, {
    name: schema.name || result.name,
    types: result.types.concat(schema.types || [])
  })

const createSchema = (...schemas) =>
  schemas.reduce(extendTypes, {
    types: [].concat(baseSchema.types)
  })

export default createSchema
