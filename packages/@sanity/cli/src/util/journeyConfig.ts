import fs from 'fs/promises'
import path from 'path'
import {type DocumentDefinition, type ObjectDefinition} from 'sanity'
import {Worker} from 'worker_threads'

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

type DocumentOrObject = DocumentDefinition | ObjectDefinition

type JourneyConfigResponse = {
  projectId: string
  datasetName: string
  displayName: string
  isFirstProject: boolean // Always true for now, making it compatible with the existing getOrCreateProject
}

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
      await fs.writeFile(filePath, JourneySchemaToFileContents(document))
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
 * @returns
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
    const response: JourneyConfigResponse = await apiClient({
      requireUser: true,
      requireProject: true,
    }).request({
      method: 'GET',
      uri: `journey/projects/${projectId}`,
    })

    return {
      projectId: response.projectId,
      datasetName: response.datasetName,
      displayName: response.displayName,
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
    const response = await import(`https://api.sanity.io/vX/journey/projects/${projectId}/schema`)

    // const response = await apiClient({
    //   requireUser: true,
    //   requireProject: true,
    // }).request({
    //   method: 'GET',
    //   uri: `journey/projects/${projectId}/schema`,
    // })

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
function JourneySchemaToFileContents(schema: DocumentOrObject): string {
  const prettySchema = prettyJourneySchema(schema)
  return `export const ${schema.name} = ${prettySchema}\n`
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
 * Pretty print a Journey schema as a string
 *
 * @param schemas - The Journey schema to pretty print
 * @returns The pretty printed Journey schema
 */
function prettyJourneySchema(schemas: object) {
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
