import {type SchemaType} from 'groq-js'
import {useMemo} from 'react'
import {type Schema} from 'sanity'
import {useSchema} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1'

import {getDocumentTypeNames} from '../util/documentTypes'
import {getNumberRules} from '../util/numberRules'
import {inferQueryParams, type NumberRules, type ParamInference} from '../util/paramInference'
import {getGroqSchema} from '../util/typegen/evaluateQueryType'

export interface ParamsInference extends ParamInference {
  /** The workspace schema in groq-js form, which the exports declare referenced types from */
  groqSchema: SchemaType | undefined
  /** The workspace schema could not be read, so the types come from the query alone */
  schemaUnavailable: boolean
}

/**
 * The params a query uses and their expected types, against the workspace schema when it can.
 * Given the params' values, a param the query says nothing about is typed from its value.
 */
export function useParamsInference(
  query: string,
  values?: Record<string, unknown>,
): ParamsInference {
  const schema = useSchema() as Schema | undefined
  const groqSchema = useMemo((): SchemaType | undefined => {
    if (!schema) return undefined
    try {
      return getGroqSchema(schema)
    } catch {
      return undefined
    }
  }, [schema])
  const documentTypes = useMemo(() => (schema ? getDocumentTypeNames(schema) : []), [schema])
  const numberRules = useMemo(
    () =>
      schema
        ? (documentType: string, path: string[]): NumberRules | undefined =>
            getNumberRules(schema, documentType, path)
        : undefined,
    [schema],
  )
  return useMemo(
    () => ({
      ...inferQueryParams(query, {schema: groqSchema, documentTypes, numberRules, values}),
      groqSchema,
      schemaUnavailable: !groqSchema,
    }),
    [documentTypes, groqSchema, numberRules, query, values],
  )
}
