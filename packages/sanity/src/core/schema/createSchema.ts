import {Schema as SchemaBuilder, type SchemaValidationResult} from '@sanity/schema'
import {builtinTypes, groupProblems, validateSchema} from '@sanity/schema/_internal'
import {type Schema} from '@sanity/types'

import {inferFromSchema as inferValidation} from '../validation'

const isError = (problem: SchemaValidationResult) => problem.severity === 'error'

// Defer the builtin schema compile out of module-eval; compute lazily on first use
// so importing createSchema does not trigger the SchemaBuilder cost at parse time.
let _builtinSchema: Schema | undefined
function getBuiltinSchema(): Schema {
  if (!_builtinSchema) {
    _builtinSchema = SchemaBuilder.compile({
      name: 'studio',
      types: builtinTypes,
    })
    inferValidation(_builtinSchema)
  }
  return _builtinSchema
}

/**
 * @hidden
 * @beta */
export function createSchema(schemaDef: {name: string; types: any[]}): Schema {
  const validated = validateSchema(schemaDef.types).getTypes()
  const validation = groupProblems(validated)
  const hasErrors = validation.some((group) => group.problems.some(isError))

  const compiled = SchemaBuilder.compile({
    name: schemaDef.name,
    types: hasErrors ? [] : schemaDef.types.filter(Boolean),
    parent: getBuiltinSchema(),
  })

  // ;(compiled as any)._source = schemaDef
  ;(compiled as any)._validation = validation

  return inferValidation(compiled as Schema)
}
