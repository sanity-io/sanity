import path from 'node:path'
import {isMainThread, Worker} from 'node:worker_threads'

import {type CliCommandContext, type CliV3CommandContext} from '@sanity/cli'
import readPkgUp from 'read-pkg-up'
import {createSchema} from 'sanity'

import {
  type ResolvedGraphQLAPI,
  type ResolvedSourceProperties,
  type SchemaDefinitionish,
  type TypeResolvedGraphQLAPI,
} from './types'

export async function getGraphQLAPIs(cliContext: CliCommandContext): Promise<ResolvedGraphQLAPI[]> {
  if (!isModernCliConfig(cliContext)) {
    throw new Error('Expected Sanity studio of version 3 or above')
  }

  if (!isMainThread) {
    throw new Error('getGraphQLAPIs() must be called from the main thread')
  }

  const defaultSchema = createSchema({name: 'default', types: []})
  const defaultTypes = defaultSchema.getTypeNames()
  const isCustomType = (type: SchemaDefinitionish) => !defaultTypes.includes(type.name)

  const apis = await getApisWithSchemaTypes(cliContext)
  const resolved = apis.map(
    ({schemaTypes, ...api}): ResolvedSourceProperties => ({
      schema: createSchema({name: 'default', types: schemaTypes.filter(isCustomType)}),
      ...api,
    }),
  )

  return resolved
}

function getApisWithSchemaTypes(cliContext: CliCommandContext): Promise<TypeResolvedGraphQLAPI[]> {
  return new Promise<TypeResolvedGraphQLAPI[]>((resolve, reject) => {
    const {cliConfig, cliConfigPath, workDir} = cliContext
    const rootPkgPath = readPkgUp.sync({cwd: __dirname})?.path
    if (!rootPkgPath) {
      throw new Error('Could not find root directory for `sanity` package')
    }

    const rootDir = path.dirname(rootPkgPath)
    const workerPath = path.join(rootDir, 'lib', '_internal', 'cli', 'threads', 'getGraphQLAPIs.js')
    const worker = new Worker(workerPath, {
      workerData: {cliConfig: serialize(cliConfig || {}), cliConfigPath, workDir},
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

function isModernCliConfig(config: CliCommandContext): config is CliV3CommandContext {
  return config.sanityMajorVersion >= 3
}

function serialize<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (cause) {
    throw new Error(`Failed to serialize CLI configuration`, {cause})
  }
}
