import {stat} from 'node:fs/promises'
import path from 'node:path'
import {isMainThread, parentPort, workerData} from 'node:worker_threads'

import {
  findQueriesInPath,
  getResolver,
  readSchema,
  registerBabel,
  TypeGenerator,
  type TypegenWorkerChannel as CodegenTypegenWorkerChannel,
} from '@sanity/codegen'
import {type WorkerChannel, WorkerChannelReporter} from '@sanity/worker-channels'

export interface TypegenGenerateTypesWorkerData {
  workDir: string
  schemaPath: string
  searchPath: string | string[]
  overloadClientMethods?: boolean
}

if (isMainThread || !parentPort) {
  throw new Error('This module must be run as a worker thread')
}

registerBabel()

export type TypegenWorkerChannel = WorkerChannel.Definition<
  {
    loadedSchema: WorkerChannel.Event
    typegenStarted: WorkerChannel.Event<{expectedFileCount: number}>
    typegenComplete: WorkerChannel.Event<{code: string}>
  } & CodegenTypegenWorkerChannel['__definition']
>

async function main({
  schemaPath,
  searchPath,
  workDir,
  overloadClientMethods,
}: TypegenGenerateTypesWorkerData) {
  const report = WorkerChannelReporter.from<TypegenWorkerChannel>(parentPort)

  const fullPath = path.isAbsolute(schemaPath) ? schemaPath : path.join(workDir, schemaPath)

  try {
    const schemaStats = await stat(fullPath)
    if (!schemaStats.isFile()) {
      throw new Error(`Schema path is not a file: ${schemaPath}`)
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      // If the user has not provided a specific schema path (eg we're using the default), give some help
      const hint = schemaPath === './schema.json' ? ` - did you run "sanity schema extract"?` : ''
      throw new Error(`Schema file not found: ${fullPath}${hint}`, {cause: err})
    }
    throw err
  }

  const schema = await readSchema(fullPath)

  report.event.loadedSchema()

  const typeGenerator = new TypeGenerator()

  const {files, queries} = findQueriesInPath({
    path: searchPath,
    resolver: getResolver(workDir),
  })
  report.event.typegenStarted({expectedFileCount: files.length})

  const result = await typeGenerator.generateTypes({
    queries,
    schema,
    reporter: report,
    schemaPath,
    root: workDir,
    overloadClientMethods,
  })
  report.event.typegenComplete(result)
}

main(workerData).catch((err) => {
  // worker will terminate and parent will catch the error
  throw err
})
