import types from '../types'

import debug from './debug'
import {ifNotUniqueProp} from '../types/utils'

function defineSchemaType(schemaTypeDef) {
  // maybe warn if toplevel type definition is different from the passed in typeDef
  debug('registering custom schema type "%s" of "%s"', schemaTypeDef.name, schemaTypeDef.type)

  const basicType = types[schemaTypeDef.type]

  if (!basicType) {
    throw new Error(`Invalid type: ${schemaTypeDef.type}`)
  }

  return {
    parse(fieldDef) {
      return fieldDef
    }
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

  const schemaTypes = {}
  // Create type builders for all schema types

  schema.types.forEach(typeDef => {
    const type = types[typeDef.type]
    if (!type) {
      throw new Error(`Invalid type for specified for schema type "${typeDef.name}": "${typeDef.type}" `)
    }
    schemaTypes[typeDef.name] = defineSchemaType(typeDef)
  })

  const typeParsers = Object.assign({}, types, schemaTypes)

  const compiledTypes = {}
  schema.types.forEach(typeDef => {
    compiledTypes[typeDef.name] = typeParsers[typeDef.type].parse(typeDef, typeParsers)
  })

  return {types: compiledTypes}
}
