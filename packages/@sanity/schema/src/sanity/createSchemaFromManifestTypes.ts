import {Schema} from '../legacy/Schema'
import {builtinTypes} from './builtinTypes'

const builtinSchema = Schema.compile({
  name: 'studio',
  types: builtinTypes,
})

export function createSchemaFromManifestTypes(schemaDef: {name: string; types: unknown[]}) {
  return Schema.compile({
    name: schemaDef.name,
    types: schemaDef.types.map(coerceType).filter(Boolean),
    parent: builtinSchema,
  })
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

function coerceType(obj: any) {
  if (!isRecord(obj)) return undefined
  // TODO: coerce validations
  return obj
}
