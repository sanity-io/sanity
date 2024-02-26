import fs from 'fs/promises'
import path from 'path'
import {format} from 'prettier'
import {Worker} from 'worker_threads'

import {
  type ArrayDefinition,
  type BaseSchemaDefinition,
  type DocumentDefinition,
  type ObjectDefinition,
} from '../../../types'
import {type CliApiClient} from '../types'
import {getCliWorkerPath} from './cliWorker'

/**
 * A Journey schema is a server schema that is saved in the Journey API
 */

type JourneySchemaWorkerData = {
  schemasPath: string
  useTypeScript: boolean
  projectId: string
}

type JourneySchemaWorkerResult = {type: 'success'} | {type: 'error'; error: Error}

type JourneyConfigResponse = {
  projectId: string
  datasetName: string
  displayName: string
  isFirstProject: boolean // Always true for now, making it compatible with the existing getOrCreateProject
}

type DocumentOrObject = DocumentDefinition | ObjectDefinition
type SchemaObject = BaseSchemaDefinition & {type: string; fields?: SchemaObject[]}

/**
 * Fetch a Journey schema from the Sanity schema club API and write it to disk
 */
export async function getAndWriteJourneySchema(data: JourneySchemaWorkerData): Promise<void> {
  const {schemasPath, useTypeScript, projectId} = data
  try {
    const documents = await fetchJourneySchema(projectId)
    const fileExtension = useTypeScript ? 'ts' : 'js'

    // Write a file for each schema
    for (const document of documents) {
      const filePath = path.join(schemasPath, `${document.name}.${fileExtension}`)
      await fs.writeFile(filePath, await JourneySchemaToFileContents(document))
    }
    // Write an index file that exports all the schemas
    const indexContent = assembeJourneyIndexContent(documents)
    await fs.writeFile(path.join(schemasPath, `index.${fileExtension}`), indexContent)
  } catch (error) {
    throw new Error(`Failed to fetch remote schema: ${error.message}`)
  }
}

/**
 * Run the getAndWriteJourneySchema in a worker thread
 *
 * @param workerData - The worker data to pass to the worker thread
 */
export async function getAndWriteJourneySchemaWorker(
  workerData: JourneySchemaWorkerData,
): Promise<void> {
  const workerPath = await getCliWorkerPath('getAndWriteJourneySchema')
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData,
      env: {
        // eslint-disable-next-line no-process-env
        ...process.env,
        // Dynamic HTTPS imports are currently behind a Node flag
        NODE_OPTIONS: '--experimental-network-imports',
        NODE_NO_WARNINGS: '1',
      },
    })
    worker.on('message', (message: JourneySchemaWorkerResult) => {
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
 * Validate a project ID
 * Throws an error if the project ID is invalid
 */
function validateProjectId(projectId: string): void {
  if (!projectId) {
    throw new Error('ProjectId is required')
  }
  if (!/^[a-zA-Z0-9-]+$/.test(projectId)) {
    throw new Error('Invalid projectId')
  }
}

/**
 * Fetch a Journey config from the Sanity schema club API
 *
 * @param projectId - The slug of the Journey schema to fetch
 * @returns The Journey schema as an array of Sanity document or object definitions
 */
export async function fetchJourneyConfig(
  apiClient: CliApiClient,
  projectId: string,
): Promise<JourneyConfigResponse> {
  validateProjectId(projectId)
  try {
    const response: {
      projectId: string
      dataset: string
      displayName?: string
    } = await apiClient({
      requireUser: true,
      requireProject: true,
      api: {
        projectId,
        apiHost: 'https://api.sanity.work',
      },
    })
      .config({apiVersion: 'v2024-02-23'})
      .request({
        method: 'GET',
        uri: `/journey/projects/${projectId}`,
      })

    return {
      projectId: response.projectId,
      datasetName: response.dataset,
      displayName: response.displayName || 'Sanity Project', // TODO: Remove this default when the API is updated
      isFirstProject: true,
    }
  } catch (err) {
    console.error(err)
    throw new Error(`Failed to fetch remote schema config: ${projectId}`)
  }
}

/**
 * Fetch a Journey schema from the Sanity schema club API
 *
 * @param projectId - The slug of the Journey schema to fetch
 * @returns The Journey schema as an array of Sanity document or object definitions
 */
async function fetchJourneySchema(projectId: string): Promise<DocumentOrObject[]> {
  validateProjectId(projectId)
  try {
    // TODO: Add token to the request and change to sanity.io
    const response = await import(
      `https://api.sanity.work/v2024-02-23/journey/projects/${projectId}/schema`
    )

    return response.default
  } catch (err) {
    console.error(err)
    throw new Error(`Failed to fetch remote schema: ${projectId}`)
  }
}

/**
 * Wrap a Journey schema in a module export
 *
 * @param schema - The Journey schema to wrap in a module export
 * @returns The Journey schema as a module export
 */
async function JourneySchemaToFileContents(schemaType: DocumentOrObject): Promise<string> {
  const serialised = wrapSchemaTypeInHelpers(schemaType)
  const imports = getImports(serialised)
  const prettifiedSchemaType = await format(serialised, {parser: 'typescript'})
  // Start file with import, then export the schema type as a named export
  return `${imports}\n\nexport const ${schemaType.name} = ${prettifiedSchemaType}\n`
}

/**
 * Assemble a list of Journey schema module exports into a single index file
 *
 * @param schemas - The Journey schemas to assemble into an index file
 * @returns The index file as a string
 */
function assembeJourneyIndexContent(schemas: DocumentOrObject[]): string {
  schemas.sort((a, b) => (a.name > b.name ? 1 : -1)) // Sort schemas alphabetically by name
  const imports = schemas.map((schema) => `import { ${schema.name} } from './${schema.name}'`)
  const exports = schemas.map((schema) => `  ${schema.name}`).join(',\n')
  return `${imports.join('\n')}\n\nexport const schemaTypes = [\n${exports}\n]`
}

/**
 * Get the import statements for a schema type
 *
 * @param schemaType - The schema type to get the imports for
 * @returns The import statements for the schema type
 */
function getImports(schemaType: string): string {
  const defaultImports = ['defineType', 'defineField']
  if (schemaType.includes('defineArrayMember')) {
    defaultImports.push('defineArrayMember')
  }
  return `import { ${defaultImports.join(', ')} } from 'sanity'`
}

/**
 * Serialize a Sanity schema type into a string.
 * Wraps the schema object in the appropriate helper function.
 *
 * @param schemaType - The schema type to serialize
 * @returns The schema type as a string
 */
function wrapSchemaTypeInHelpers(schemaType: SchemaObject): string {
  switch (schemaType.type) {
    case 'document':
    case 'object':
      return wrapDefineType(schemaType)
    case 'array':
      return wrapDefineArrayMember(schemaType as ArrayDefinition)
    default:
      return wrapDefineField(schemaType)
  }

  function wrapDefineType(field: SchemaObject) {
    const {fields, ...rest} = field
    const restPart = serialize(rest)
    const fieldsStr = fields?.map(wrapSchemaTypeInHelpers).join('')
    const fieldsPart = fields ? `fields: [${fieldsStr}],` : ''
    return `defineType({
      ${restPart},
      ${fieldsPart}
    })`
  }

  function wrapDefineField(field: SchemaObject) {
    const fieldPart = serialize(field)
    return `defineField({${fieldPart}}),`
  }

  function wrapDefineArrayMember(field: ArrayDefinition) {
    const {of, ...rest} = field
    const restPart = serialize(rest)
    const ofStr = of.map((f) => `defineArrayMember({${serialize(f)}})`)
    const ofPart = of ? `of: [${ofStr.join(',')}],` : ''
    return `defineField({
      ${restPart},
      ${ofPart}
    }),`
  }

  function serialize(obj: object) {
    return Object.entries(obj)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}: "${value}"`
        }
        if (typeof value === 'object') {
          return `${key}: ${JSON.stringify(value)}`
        }
        return `${key}: ${value}`
      })
      .join(',')
  }
}
