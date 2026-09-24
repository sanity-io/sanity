import {extractSchema} from '@sanity/schema/_internal'
import {parse, type SchemaType, typeEvaluate, type TypeNode} from 'groq-js'
import {type Schema} from 'sanity'

import {inferTypeFromValue} from './inferTypeFromValue'

const groqSchemaCache = new WeakMap<Schema, SchemaType>()

/** The workspace schema in groq-js form, extracted once per schema instance */
function getGroqSchema(schema: Schema): SchemaType {
  let extracted = groqSchemaCache.get(schema)
  if (!extracted) {
    extracted = extractSchema(schema)
    groqSchemaCache.set(schema, extracted)
  }
  return extracted
}

export type QueryTypeEvaluation =
  | {source: 'schema'; node: TypeNode; schema: SchemaType}
  | {source: 'result'; node: TypeNode; schema: undefined; schemaError: Error | undefined}
  | {source: 'none'; schemaError: Error | undefined}

export interface EvaluateQueryTypeOptions {
  query: string
  params: Record<string, unknown>
  schema: Schema | undefined
  /** Whether a result is available to fall back to (`null` is a valid result) */
  hasResult: boolean
  result: unknown
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

/**
 * Evaluates the type of a query the way `sanity typegen` does, against the workspace schema.
 * Falls back to inferring a type from the fetched result when the schema evaluation fails or
 * yields nothing useful.
 */
export function evaluateQueryType(options: EvaluateQueryTypeOptions): QueryTypeEvaluation {
  let schemaError: Error | undefined

  if (options.schema && options.query.trim()) {
    try {
      const schema = getGroqSchema(options.schema)
      const node = typeEvaluate(parse(options.query, {params: options.params}), schema)
      if (node.type !== 'unknown') {
        return {source: 'schema', node, schema}
      }
      schemaError = new Error('The query evaluates to an unknown type against the schema')
    } catch (err) {
      schemaError = toError(err)
    }
  }

  if (options.hasResult) {
    return {
      source: 'result',
      node: inferTypeFromValue(options.result),
      schema: undefined,
      schemaError,
    }
  }

  return {source: 'none', schemaError}
}
