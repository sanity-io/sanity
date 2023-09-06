import path from 'path'
import {Worker, isMainThread} from 'worker_threads'
import readPkgUp from 'read-pkg-up'
import type {CliCommandContext} from '@sanity/cli'
import type {ResolvedSourceProperties, SchemaDefinitionish} from './types'
import {createSchema} from 'sanity'

export async function getSchemaDocumentTypeDefinitions({
  workspace,
  workDir,
}: {
  workspace?: string
} & Pick<CliCommandContext, 'workDir'>): Promise<ResolvedSourceProperties> {
  if (!isMainThread) {
    throw new Error('getSchemaDocumentTypeDefinitions() must be called from the main thread')
  }

  const defaultSchema = createSchema({name: 'default', types: []})
  const defaultTypes = defaultSchema.getTypeNames()
  const isCustomType = (type: SchemaDefinitionish) => !defaultTypes.includes(type.name)

  const source = await getDocumentTypesWithSchemaTypes({workspace, workDir})

  return {
    ...source,
    schema: createSchema({name: 'default', types: source.schemaTypes.filter(isCustomType)}),
  }
}

function getDocumentTypesWithSchemaTypes({
  workspace,
  workDir,
}: {
  workspace?: string
} & Pick<CliCommandContext, 'workDir'>): Promise<{
  projectId: string
  dataset: string
  schemaTypes: SchemaDefinitionish[]
}> {
  return new Promise<{
    projectId: string
    dataset: string
    schemaTypes: SchemaDefinitionish[]
  }>((resolve, reject) => {
    const rootPkgPath = readPkgUp.sync({cwd: __dirname})?.path
    if (!rootPkgPath) {
      throw new Error('Could not find root directory for `sanity` package')
    }

    const rootDir = path.dirname(rootPkgPath)
    const workerPath = path.join(
      rootDir,
      'lib',
      '_internal',
      'cli',
      'threads',
      'getSchemaDocumentTypeDefinitions.js',
    )
    const worker = new Worker(workerPath, {
      workerData: {workspace, workDir},
      // eslint-disable-next-line no-process-env
      env: process.env,
    })
    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`))
    })
  })
}
