import {type SchemaType} from 'groq-js'
import {useMemo} from 'react'
import {type Schema, type SchemaType as StudioSchemaType, useSchema} from 'sanity'

import {inferQueryParams, type ParamInference} from '../util/paramInference'
import {getGroqSchema} from '../util/typegen/evaluateQueryType'

function isDocumentType(type: StudioSchemaType | undefined): boolean {
  for (let current = type; current; current = current.type) {
    if (current.name === 'document') return true
  }
  return false
}

/** The workspace's document types, its own first and the `sanity.`/`system.` ones after */
export function getDocumentTypeNames(schema: Schema): string[] {
  return schema
    .getTypeNames()
    .filter((name) => name !== 'document' && isDocumentType(schema.get(name)))
    .toSorted((a, b) => Number(a.includes('.')) - Number(b.includes('.')) || a.localeCompare(b))
}

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
