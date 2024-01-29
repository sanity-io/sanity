import {SanityDocument} from '@sanity/types'
import {APIConfig, Migration} from '../types'
import {fromExportEndpoint, safeJsonParser} from '../sources/fromExportEndpoint'
import {streamToAsyncIterator} from '../utils/streamToAsyncIterator'
import {bufferThroughFile} from '../fs-webstream/bufferThroughFile'
import {asyncIterableToStream} from '../utils/asyncIterableToStream'
import {parse} from '../it-utils/ndjson'
import {decodeText} from '../it-utils'
import {collectMigrationMutations} from './collectMigrationMutations'
import {getBufferFilePath} from './utils/getBufferFile'
import {createBufferFileContext} from './utils/createBufferFileContext'
import {applyFilters} from './utils/applyFilters'

interface MigrationRunnerOptions {
  api: APIConfig
}

export async function* dryRun(config: MigrationRunnerOptions, migration: Migration) {
  const filteredDocuments = applyFilters(
    migration,
    parse<SanityDocument>(
      decodeText(
        streamToAsyncIterator(
          await fromExportEndpoint({...config.api, documentTypes: migration.documentTypes}),
        ),
      ),
      {parse: safeJsonParser},
    ),
  )

  const abortController = new AbortController()
  const createReader = bufferThroughFile(
    asyncIterableToStream(filteredDocuments),
    getBufferFilePath(),
    {signal: abortController.signal},
  )

  const context = createBufferFileContext(createReader)

  const mutations = collectMigrationMutations(
    migration,
    () => parse(decodeText(streamToAsyncIterator(createReader())), {parse: safeJsonParser}),
    context,
  )

  // stop buffering the export once we're done collecting all mutations
  abortController.abort()

  for await (const mutation of mutations) {
    if (!mutation) continue
    yield JSON.stringify(mutation, null, 2)
  }
}
