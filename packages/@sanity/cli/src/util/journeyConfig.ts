import fs from 'node:fs/promises'
import path from 'node:path'
import {Worker} from 'node:worker_threads'

import {
  type BaseSchemaDefinition,
  type DocumentDefinition,
  type ObjectDefinition,
} from '@sanity/types'
import {format} from 'prettier'

import {type CliApiClient} from '../types'
import {getCliWorkerPath} from './cliWorker'

/**
 * A Journey schema is a server schema that is saved in the Journey API
 */

interface JourneySchemaWorkerData {
  schemasPath: string
  useTypeScript: boolean
  schemaUrl: string
}

type JourneySchemaWorkerResult = {type: 'success'} | {type: 'error'; error: Error}

interface JourneyConfigResponse {
  projectId: string
  datasetName: string
  displayName: string
  schemaUrl: string
  isFirstProject: boolean // Always true for now, making it compatible with the existing getOrCreateProject
}

type DocumentOrObject = DocumentDefinition | ObjectDefinition
type SchemaObject = BaseSchemaDefinition & {
  type: string
  fields?: SchemaObject[]
  of?: SchemaObject[]
  preview?: object
}

/**
 * Fetch a Journey schema from the Sanity schema club API and write it to disk
 */
export async function getAndWriteJourneySchema(data: JourneySchemaWorkerData): Promise<void> {
  const {schemasPath, useTypeScript, schemaUrl} = data
  try {
    const documentTypes = await fetchJourneySchema(schemaUrl)
    const fileExtension = useTypeScript ? 'ts' : 'js'

    // Write a file for each schema
    for (const documentType of documentTypes) {
      const filePath = path.join(schemasPath, `${documentType.name}.${fileExtension}`)
      await fs.writeFile(filePath, await assembleJourneySchemaTypeFileContent(documentType))
    }
    // Write an index file that exports all the schemas
    const indexContent = await assembleJourneyIndexContent(documentTypes)
    await fs.writeFile(path.join(schemasPath, `index.${fileExtension}`), indexContent)
  } catch (error) {
    throw new Error(`Failed to fetch remote schema: ${error.message}`)
  }
}

/**
 * Executes the `getAndWriteJourneySchema` operation within a worker thread.
 *
 * This method is designed to safely import network resources by leveraging the `--experimental-network-imports` flag.
 * Due to the experimental nature of this flag, its use is not recommended in the main process. Consequently,
 * the task is delegated to a worker thread to ensure both safety and compliance with best practices.
 *
 * The core functionality involves fetching schema definitions from our own trusted API and writing them to disk.
 * This includes handling both predefined and custom schemas. For custom schemas, a process ensures
 * that they undergo JSON parsing to remove any JavaScript code and are validated before being saved.
 *
 * Depending on the configuration, the schemas are saved as either TypeScript or JavaScript files, dictated by the `useTypeScript` flag within the `workerData`.
 *
 * @param workerData - An object containing the necessary data and flags for the worker thread, including the path to save schemas, flags indicating whether to use TypeScript, and any other relevant configuration details.
 * @returns A promise that resolves upon successful execution of the schema fetching and writing process or rejects if an error occurs during the operation.
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
        message.error.message = `Import schema worker failed: ${message.error.message}`
        reject(message.error)
      }
    })
    worker.on('error', (error) => {
      error.message = `Import schema worker failed: ${error.message}`
      reject(error)
    })
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`))
      }
    })
  })
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
  if (!projectId) {
    throw new Error('ProjectId is required')
  }
  if (!/^[a-zA-Z0-9-]+$/.test(projectId)) {
    throw new Error('Invalid projectId')
  }
  try {
    const response: {
      projectId: string
      dataset: string
      displayName?: string
      schemaUrl: string
    } = await apiClient({
      requireUser: true,
      requireProject: true,
      api: {projectId},
    })
      .config({apiVersion: 'v2024-02-23'})
      .request({
        method: 'GET',
        uri: `/journey/projects/${projectId}`,
      })

    return {
      projectId: response.projectId,
      datasetName: response.dataset,
      displayName: response.displayName || 'Sanity Project',
      // The endpoint returns a signed URL that can be used to fetch the schema as ESM
      schemaUrl: response.schemaUrl,
      isFirstProject: true,
    }
  } catch (err) {
    throw new Error(`Failed to fetch remote schema config: ${projectId}`)
  }
}

/**
 * Fetch a Journey schema from the Sanity schema club API
 *
 * @param projectId - The slug of the Journey schema to fetch
 * @returns The Journey schema as an array of Sanity document or object definitions
 */
async function fetchJourneySchema(schemaUrl: string): Promise<DocumentOrObject[]> {
  try {
    const response = await import(schemaUrl)
    return response.default
  } catch (err) {
    throw new Error(`Failed to fetch remote schema: ${schemaUrl}`)
  }
}

/**
 * Assemble a Journey schema type into a module export
 * Include the necessary imports and export the schema type as a named export
 *
 * @param schema - The Journey schema to export
 * @returns The Journey schema as a module export
 */
async function assembleJourneySchemaTypeFileContent(schemaType: DocumentOrObject): Promise<string> {
  const serialised = wrapSchemaTypeInHelpers(schemaType)
  const imports = getImports(serialised)
  const prettifiedSchemaType = await format(serialised, {
    parser: 'typescript',
    printWidth: 40,
  })
  // Start file with import, then export the schema type as a named export
  return `${imports}\n\nexport const ${schemaType.name} = ${prettifiedSchemaType}\n`
}

/**
 * Assemble a list of Journey schema module exports into a single index file
 *
 * @param schemas - The Journey schemas to assemble into an index file
 * @returns The index file as a string
 */
function assembleJourneyIndexContent(schemas: DocumentOrObject[]): Promise<string> {
  const sortedSchema = schemas.slice().sort((a, b) => (a.name > b.name ? 1 : -1))
  const imports = sortedSchema.map((schema) => `import { ${schema.name} } from './${schema.name}'`)
  const exports = sortedSchema.map((schema) => schema.name).join(',')
  const fileContents = `${imports.join('\n')}\n\nexport const schemaTypes = [${exports}]`
  return format(fileContents, {parser: 'typescript'})
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
 * Serialize a singleSanity schema type (signular) into a string.
 * Wraps the schema object in the appropriate helper function.
 *
 * @param schemaType - The schema type to serialize
 * @returns The schema type as a string
 */
/**
 * Serializes a single Sanity schema type into a string.
 * Wraps the schema object in the appropriate helper function.
 *
 * @param schemaType - The schema type to serialize
 * @param root - Whether the schemaType is the root object
 * @returns The serialized schema type as a string
 */
export function wrapSchemaTypeInHelpers(schemaType: SchemaObject, root: boolean = true): string {
  if (root) {
    return generateSchemaDefinition(schemaType, 'defineType')
  } else if (schemaType.type === 'array') {
    return `${generateSchemaDefinition(schemaType, 'defineField')},`
  }
  return `${generateSchemaDefinition(schemaType, 'defineField')},`

  function generateSchemaDefinition(
    object: SchemaObject,
    definitionType: 'defineType' | 'defineField',
  ): string {
    const {fields, preview, of, ...otherProperties} = object

    const serializedProps = serialize(otherProperties)
    const fieldsDef =
      fields && `fields: [${fields.map((f) => wrapSchemaTypeInHelpers(f, false)).join('')}]`
    const ofDef = of && `of: [${of.map((f) => `defineArrayMember({${serialize(f)}})`).join(',')}]`
    const previewDef = preview && `preview: {${serialize(preview)}}`

    const combinedDefinitions = [serializedProps, fieldsDef, ofDef, previewDef]
      .filter(Boolean)
      .join(',')
    return `${definitionType}({ ${combinedDefinitions} })`
  }

  function serialize(obj: object) {
    return Object.entries(obj)
      .map(([key, value]) => {
        if (key === 'prepare') {
          return `${value.toString()}`
        }
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
