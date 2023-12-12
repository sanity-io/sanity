import {DocumentDefinition, ObjectDefinition} from '@sanity/types'

type DocumentOrObject = DocumentDefinition | ObjectDefinition

const BUILDER_URL_BASE = 'https://schema.club/api/get-schema'

/**
 * Fetch a builder schema from the Sanity schema club API
 *
 * @param builderId - The slug of the builder schema to fetch
 * @returns The builder schema as an array of Sanity document or object definitions
 */
export async function fetchBuilderSchema(builderId: string): Promise<DocumentOrObject[]> {
  if (!builderId) {
    throw new Error('Builder ID is required')
  }
  try {
    const response = await fetch(`${BUILDER_URL_BASE}/${builderId}`)
    const text = await response.text()
    return safeishEval(text)
  } catch (err) {
    throw new Error(`Failed to fetch builder schema ${builderId}`)
  }
}

/**
 * Pretty print a builder schema as a string
 *
 * @param schemas - The builder schema to pretty print
 * @returns The pretty printed builder schema
 */
export function prettyBuilderSchema(schemas: object) {
  return JSON.stringify(
    schemas,
    (_, value: unknown) => {
      // Replace functions with a string representation since they can't be serialized
      if (typeof value === 'function') {
        const fnString = value?.toString().replace(/\s*=>\s*/g, ' => ')
        return `function:${fnString}`
      }
      return value
    },
    2,
  )
    .replace(/"([^"]+)":/g, '$1:') // Remove quotes around keys
    .replace(/"function:([^"]+)"/g, '$1') // Remove quotes around functions (and the function: prefix)
    .replace(/"/g, "'") // Replace double quotes with single quotes
}

/**
 * Wrap a builder schema in a module export
 *
 * @param schema - The builder schema to wrap in a module export
 * @returns The builder schema as a module export
 */
export function builderSchemaToFileContents(schema: DocumentOrObject): string {
  const prettySchema = prettyBuilderSchema(schema)
  return `export const ${schema.name} = ${prettySchema}\n`
}

/**
 * Assemble a list of builder schema module exports into a single index file
 *
 * @param schemas - The builder schemas to assemble into an index file
 * @returns The index file as a string
 */
export function assembeIndexContent(schemas: DocumentOrObject[]): string {
  schemas.sort((a, b) => (a.name > b.name ? 1 : -1)) // Sort schemas alphabetically by name
  const imports = schemas.map((schema) => `import { ${schema.name} } from './${schema.name}'`)
  const exports = schemas.map((schema) => `\t${schema.name}`).join(',\n')
  return `${imports.join('\n')}\n\nexport const schemaTypes = [\n${exports}\n]`
}

/**
 * Safely evaluate a string as JavaScript
 *
 * @param code - The code to evaluate
 * @returns The result of the evaluation
 */
function safeishEval(code: string): DocumentOrObject[] {
  // eslint-disable-next-line no-new-func
  return Function(`"use strict";return (${code})`)()
}
