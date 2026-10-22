import {type SchemaType} from 'groq-js'
import {useMemo} from 'react'
import {type Schema, useSchema} from 'sanity'

import {getDocumentTypeNames} from '../util/documentTypes'
import {inferQueryParams, type ParamInference} from '../util/paramInference'
import {getGroqSchema} from '../util/typegen/evaluateQueryType'

export interface ParamsInference extends ParamInference {
  /** The workspace schema could not be read, so the types come from the query alone */
  schemaUnavailable: boolean
}

/** The params a query uses and their expected types, against the workspace schema when it can */
export function useParamsInference(query: string): ParamsInference {
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
  return useMemo(
    () => ({
      ...inferQueryParams(query, {schema: groqSchema, documentTypes}),
      schemaUnavailable: !groqSchema,
    }),
    [documentTypes, groqSchema, query],
  )
}
