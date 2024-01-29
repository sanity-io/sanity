import {CompactFormatter} from '@bjoerge/mutiny'
import {SanityDocument} from '@sanity/types'
import {APIConfig, Migration} from '../types'
import {ndjson} from '../it-utils/ndjson'
import {fromExportEndpoint, safeJsonParser} from '../sources/fromExportEndpoint'
import {streamToAsyncIterator} from '../utils/streamToAsyncIterator'
import {bufferThroughFile} from '../fs-webstream/bufferThroughFile'
import {collectMigrationMutations} from './collectMigrationMutations'
import {getBufferFilePath} from './utils/getBufferFile'

interface MigrationRunnerOptions {
  api: APIConfig
}

export async function* dryRun(config: MigrationRunnerOptions, migration: Migration) {
  const exportStream = bufferThroughFile(
    await fromExportEndpoint({...config.api, documentTypes: migration.documentTypes}),
    getBufferFilePath(),
  )

  const mutations = collectMigrationMutations(
    migration,
    ndjson<SanityDocument>(streamToAsyncIterator(exportStream), {
      parse: safeJsonParser,
    }),
  )

  for await (const mutation of mutations) {
    if (!mutation) continue
    yield CompactFormatter.format(Array.isArray(mutation) ? mutation : [mutation])
  }
  await exportStream.cancel()
}
