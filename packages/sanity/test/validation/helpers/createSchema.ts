import {Schema as SchemaBuilder} from '@sanity/schema'
import {validateSchema, groupProblems} from '@sanity/schema/_internal'
import type {Schema} from '@sanity/types'

export function createSchema(schemaDef: {name?: string; types: any[]}): Schema {
  const validated = validateSchema(schemaDef.types).getTypes()
  const validation = groupProblems(validated)

  const types = [...schemaDef.types]

  // Add builtin types
  types.push({type: 'object', name: 'slug'})

  // if (!types.find((t) => t.name === 'slug')) {
  //   types.push()
  // }

  const schema = SchemaBuilder.compile({
    name: schemaDef.name || 'default',
    types,
  })

  //
  ;(schema as any)._validation = validation

  return schema
}
