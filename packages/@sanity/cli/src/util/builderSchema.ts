import fs from 'fs/promises'
import path from 'path'
import {Worker} from 'worker_threads'
import {DocumentDefinition, ObjectDefinition} from '@sanity/types'
import {getCliWorkerPath} from './cliWorker'

type BuilderSchemaWorkerData = {
  schemasPath: string
  useTypeScript: boolean
  schemaId: string
}

type BuilderSchemaWorkerResult = {type: 'success'} | {type: 'error'; error: Error}

type DocumentOrObject = DocumentDefinition | ObjectDefinition

/**
 * Fetch a builder schema from the Sanity schema club API and write it to disk
 */
export async function getAndWriteBuilderSchema(data: BuilderSchemaWorkerData): Promise<void> {
  const {schemasPath, useTypeScript, schemaId} = data
  try {
    const documents = await fetchBuilderSchema(schemaId)
    const fileExtension = useTypeScript ? 'ts' : 'js'
    // Write a file for each schema
    for (const document of documents) {
      const filePath = path.join(schemasPath, `${document.name}.${fileExtension}`)
      await fs.writeFile(filePath, builderSchemaToFileContents(document))
    }
    // Write an index file that exports all the schemas
    const indexContent = assembeBuilderIndexContent(documents)
    await fs.writeFile(path.join(schemasPath, `index.${fileExtension}`), indexContent)
  } catch (error) {
    throw new Error(`Failed to fetch builder schema: ${error.message}`)
  }
}

/**
 * Run the getAndWriteBuilderSchema in a worker thread
 *
 * @param workerData - The worker data to pass to the worker thread
 * @returns
 */
export async function getAndWriteBuilderSchemaWorker(
  workerData: BuilderSchemaWorkerData,
): Promise<void> {
  const workerPath = await getCliWorkerPath('getAndWriteBuilderSchema')
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData,
      env: {
        // eslint-disable-next-line no-process-env
        ...process.env,
        // Dynamic HTTPS imports are currently behind a Node flag
        NODE_OPTIONS: '--experimental-network-imports',
      },
    })
    worker.on('message', (message: BuilderSchemaWorkerResult) => {
      if (message.type === 'success') {
        resolve()
      } else {
        reject(message.error)
      }
    })
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  })
}

/**
 * Fetch a builder schema from the Sanity schema club API
 *
 * @param schemaId - The slug of the builder schema to fetch
 * @returns The builder schema as an array of Sanity document or object definitions
 */
async function fetchBuilderSchema(schemaId: string): Promise<DocumentOrObject[]> {
  if (!schemaId) {
    throw new Error('SchemaId is required')
  }
  if (!/^[a-zA-Z0-9-]+$/.test(schemaId)) {
    throw new Error('Invalid schemaId')
  }

  try {
    const URL = 'https://schema.club/api/get-schema'
    const response = await import(`${URL}/${schemaId}`)
    return response.default
  } catch (err) {
    console.error(err)
    throw new Error(`Failed to fetch builder schema ${schemaId}`)
  }
}

/**
 * Wrap a builder schema in a module export
 *
 * @param schema - The builder schema to wrap in a module export
 * @returns The builder schema as a module export
 */
function builderSchemaToFileContents(schema: DocumentOrObject): string {
  const prettySchema = prettyBuilderSchema(schema)
  return `export const ${schema.name} = ${prettySchema}\n`
}

/**
 * Assemble a list of builder schema module exports into a single index file
 *
 * @param schemas - The builder schemas to assemble into an index file
 * @returns The index file as a string
 */
function assembeBuilderIndexContent(schemas: DocumentOrObject[]): string {
  schemas.sort((a, b) => (a.name > b.name ? 1 : -1)) // Sort schemas alphabetically by name
  const imports = schemas.map((schema) => `import { ${schema.name} } from './${schema.name}'`)
  const exports = schemas.map((schema) => `  ${schema.name}`).join(',\n')
  return `${imports.join('\n')}\n\nexport const schemaTypes = [\n${exports}\n]`
}

/**
 * Pretty print a builder schema as a string
 *
 * @param schemas - The builder schema to pretty print
 * @returns The pretty printed builder schema
 */
function prettyBuilderSchema(schemas: object) {
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
