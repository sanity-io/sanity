import Schema from '../src/Schema'

import rawSchemas from './fixtures/schemas'

function test(schemas) {
  Object.keys(schemas).forEach(name => {
    parseSchema(schemas[name])
  })
}

function parseSchema(schemaDef) {
  const schema = new Schema(schemaDef)
  schema.getTypeNames().forEach(typeName => {
    const type = schema.get(typeName)
  })
  console.log('success! %s', schemaDef.name)
}


test(rawSchemas)
