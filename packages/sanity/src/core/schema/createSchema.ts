import {Schema as SchemaBuilder, type SchemaValidationResult} from '@sanity/schema'
import {builtinTypes, groupProblems, validateSchema} from '@sanity/schema/_internal'
import {type Schema} from '@sanity/types'
import {inferFromSchema as inferValidation} from '@sanity/validation/_internal'

const isError = (problem: SchemaValidationResult) => problem.severity === 'error'

export const builtinSchema: Schema = SchemaBuilder.compile({
  name: 'studio',
  types: builtinTypes,
})
inferValidation(builtinSchema)

/**
 * @hidden
 * @beta
 */
export function createSchema(schemaDef: {name: string; types: any[]}): Schema {
  const validated = validateSchema(schemaDef.types).getTypes()
  const validation = groupProblems(validated)
  const hasErrors = validation.some((group) => group.problems.some(isError))

  const compiled = SchemaBuilder.compile({
    name: schemaDef.name,
    types: hasErrors ? [] : schemaDef.types.filter(Boolean),
    parent: builtinSchema,
  })

  // ;(compiled as any)._source = schemaDef
  ;(compiled as any)._validation = validation

  return inferValidation(compiled as Schema)
}

/**
 * `createSchema` for the tooling in `sanity/cli`, which may only import the internals entry.
 *
 * @internal
 */
export function createSchemaForCli(schemaDef: Parameters<typeof createSchema>[0]): Schema {
  return createSchema(schemaDef)
}
