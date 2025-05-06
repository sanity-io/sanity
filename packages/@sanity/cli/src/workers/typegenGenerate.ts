/* eslint-disable max-statements */
import {stat} from 'node:fs/promises'
import {isMainThread, parentPort, workerData as _workerData} from 'node:worker_threads'

import {
  DEFAULT_CONFIG,
  findQueriesInPath,
  getResolver,
  readSchema,
  registerBabel,
  TypeGenerator,
} from '@sanity/codegen'
import {type SchemaType} from 'groq-js'

import {
  createReporter,
  type WorkerChannel,
  type WorkerChannelEvent,
  type WorkerChannelStream,
} from '../util/workerChannel'

const DEFAULT_SCHEMA_PATH = DEFAULT_CONFIG.schemas[0].schemaPath

export interface TypegenGenerateTypesWorkerData {
  workDir: string
  schemas: {schemaPath: string; schemaId: string}[]
  searchPath: string | string[]
  overloadClientMethods: boolean
  augmentGroqModule: boolean
}

interface QueryProgress {
  queriesCount: number
  projectionsCount: number
  filesCount: number
}

/** @internal */
export type TypegenWorkerChannel = WorkerChannel<{
  loadedSchemas: WorkerChannelEvent
  generatedSchemaDeclarations: WorkerChannelEvent<{
    code: string
    schemaStats: {
      schemaTypesCount: number
      schemaCount: number
    }
  }>
  fileCount: WorkerChannelEvent<{fileCount: number}>
  generatedQueryResultDeclaration: WorkerChannelStream<
    | {
        type: 'progress'
        progress: QueryProgress
      }
    | {
        type: 'declaration'
        code: string
        progress: QueryProgress
      }
    | {
        type: 'error'
        message: string
        progress: QueryProgress
      }
  >
  generationComplete: WorkerChannelEvent<{
    augmentedQueryResultDeclarations: {code: string}
    queryStats: {
      queriesCount: number
      projectionsCount: number
      totalScannedFilesCount: number
      queryFilesCount: number
      projectionFilesCount: number
      filesWithErrors: number
      errorCount: number
      typeNodesGenerated: number
      unknownTypeNodesGenerated: number
      unknownTypeNodesRatio: number
      emptyUnionTypeNodesGenerated: number
    }
  }>
}>

if (isMainThread || !parentPort) {
  throw new Error('This module must be run as a worker thread')
}

const report = createReporter<TypegenWorkerChannel>(parentPort)
const opts = _workerData as TypegenGenerateTypesWorkerData

async function main() {
  const schemas: {schema: SchemaType; schemaId: string; filename: string}[] = []

  for (const {schemaId, schemaPath} of opts.schemas) {
    try {
      const schemaStats = await stat(schemaPath)
      if (!schemaStats.isFile()) {
        throw new Error(
          `Failed to load schema "${schemaId}". Schema path is not a file: ${schemaPath}`,
        )
      }

      const schema = await readSchema(schemaPath)
      schemas.push({schema, schemaId, filename: schemaPath})
    } catch (err) {
      if (err.code === 'ENOENT') {
        // If the user has not provided a specific schema path (eg we're using the default), give some help
        const hint =
          schemaPath === DEFAULT_SCHEMA_PATH ? ` - did you run "sanity schema extract"?` : ''
        throw new Error(`Schema file not found for schema "${schemaId}": ${schemaPath}${hint}`)
      } else {
        throw err
      }
    }
  }
  report.event.loadedSchemas()

  const generator = new TypeGenerator({
    schemas,
    queriesByFile: findQueriesInPath({path: opts.searchPath, resolver: getResolver()}),
    augmentGroqModule: opts.augmentGroqModule,
    overloadClientMethods: opts.overloadClientMethods,
  })

  report.event.generatedSchemaDeclarations({
    code: [
      generator.getKnownTypes().code,
      ...generator.getSchemaTypeDeclarations().map((i) => i.code),
      generator.getAllSanitySchemaTypesDeclaration().code,
      ...generator.getSchemaDeclarations().map((i) => i.code),
      generator.getAugmentedSchemasDeclarations().code,
    ].join('\n'),
    schemaStats: {
      schemaTypesCount: generator.getSchemaTypeDeclarations().length,
      schemaCount: schemas.length,
    },
  })

  const allFilenames = new Set<string>()
  const errorFilenames = new Set<string>()
  const queryFilenames = new Set<string>()
  const projectionFilenames = new Set<string>()

  let errorCount = 0
  let queriesCount = 0
  let projectionsCount = 0
  let typeNodesGenerated = 0
  let unknownTypeNodesGenerated = 0
  let emptyUnionTypeNodesGenerated = 0

  const {fileCount} = await generator.getQueryFileCount()
  report.event.fileCount({fileCount})

  for await (const {filename, ...result} of generator.getQueryResultDeclarations()) {
    allFilenames.add(filename)
    const progress = {
      queriesCount,
      projectionsCount,
      filesCount: allFilenames.size,
    }

    switch (result.type) {
      case 'error': {
        errorCount += 1
        errorFilenames.add(filename)

        const errorMessage =
          typeof result.error === 'object' && result.error !== null && 'message' in result.error
            ? String(result.error.message)
            : 'Unknown Error'

        const message = `Error generating types in "${filename}": ${errorMessage}`
        report.stream.generatedQueryResultDeclaration.emit({type: 'error', message, progress})
        continue
      }

      case 'queries': {
        if (!result.queryResultDeclarations.length) {
          report.stream.generatedQueryResultDeclaration.emit({type: 'progress', progress})
          continue
        }

        for (const {code, type, stats} of result.queryResultDeclarations) {
          queriesCount += type === 'query' ? 1 : 0
          projectionsCount += type === 'projection' ? 1 : 0
          typeNodesGenerated += stats.allTypes
          unknownTypeNodesGenerated += stats.unknownTypes
          emptyUnionTypeNodesGenerated += stats.emptyUnions

          if (type === 'projection') {
            projectionFilenames.add(filename)
          } else {
            queryFilenames.add(filename)
          }

          report.stream.generatedQueryResultDeclaration.emit({type: 'declaration', code, progress})
        }
        continue
      }

      default: {
        continue
      }
    }
  }
  report.stream.generatedQueryResultDeclaration.end()

  report.event.generationComplete({
    augmentedQueryResultDeclarations: await generator.getAugmentedQueryResultsDeclarations(),
    queryStats: {
      errorCount,
      queriesCount,
      projectionsCount,
      typeNodesGenerated,
      unknownTypeNodesGenerated,
      emptyUnionTypeNodesGenerated,
      totalScannedFilesCount: allFilenames.size,
      filesWithErrors: errorFilenames.size,
      queryFilesCount: queryFilenames.size,
      projectionFilesCount: projectionFilenames.size,
      unknownTypeNodesRatio:
        typeNodesGenerated > 0 ? unknownTypeNodesGenerated / typeNodesGenerated : 0,
    },
  })
}

registerBabel()
main()
