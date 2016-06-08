import {pick, omit} from 'lodash'
import basicTypeBuilders from './types/builders'
import debug from './debug'
import {ifNotUniqueProp} from './types/utils'

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

  // sanity checks
  schema.types.forEach(typeDef => {
    if (!typeDef.type) {
      throw new Error(`Missing type declaration for schema type "${typeDef.name}"`)
    }
  })

  ifNotUniqueProp(schema.types, 'name', dupe => {
    throw new Error(`Duplicate schema type: ${dupe.name}. Check schema definition file for "${schema.name}"'`)
  })

  const schemaTypeBuilders = {}
  // Create type builders for all schema types

  schema.types.forEach(typeDef => {
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

  schema.types.forEach(typeDef => {
    const typeBuilder = typeBuilders[typeDef.type]
    compiled.types[typeDef.name] = typeBuilder(typeDef, typeBuilders, schema)
  })

  return compiled
}
