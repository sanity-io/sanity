import {pick, omit} from 'lodash'
import basicTypeBuilders from './types/builders'
import debug from './debug'

function createSchemaTypeBuilder(schemaTypeDef) {
  // maybe warn if toplevel type definition is different from the passed in typeDef
  debug('registered custom schema type "%s" of "%s"', schemaTypeDef.name, schemaTypeDef.type)

  // const builder = basicTypeBuilders[toplevelTypeDef.type]

  // if (!builder) {
  //   throw new Error(`Invalid type: ${toplevelTypeDef.type}`)
  // }
  //
  // builder(toplevelTypeDef)
  return (typeDef, typeBuilders, schema) => {
    return Object.assign(
      pick(typeDef, ['name', 'title', 'type']),
      {
        options: omit(typeDef, ['type', 'title'])
      }
    )
  }
}

export function compile(schema) {

  const typeDefs = Object.keys(schema.types).map(typeName => {
    const typeDef = schema.types[typeName]
    if (typeDef.name) {
      throw new Error(
        `Don't specify type name. It's automatically added. Please check type definition for type ${typeName}`
      )
    }
    if (!typeDef.type) {
      throw new Error(`Missing type declaration for schema type "${typeDef.name}"`)
    }
    // Attach name to type definition
    return Object.assign({}, typeDef, {name: typeName})
  })

  const schemaTypeBuilders = {}
  // Create type builders for all schema types
  typeDefs.forEach(typeDef => {
    const builder = basicTypeBuilders[typeDef.type]
    if (!builder) {
      throw new Error(`Invalid type for specified for schema type "${typeDef.name}": "${typeDef.type}" `)
    }
    schemaTypeBuilders[typeDef.name] = createSchemaTypeBuilder(typeDef)
  })

  // todo: check for conflicts

  const typeBuilders = Object.assign({}, basicTypeBuilders, schemaTypeBuilders)

  const compiled = {
    types: {}
  }

  typeDefs.forEach(typeDef => {
    const typeBuilder = typeBuilders[typeDef.type]
    compiled.types[typeDef.name] = typeBuilder(typeDef, typeBuilders, schema)
  })

  return compiled
}
