import arrify from 'arrify'
import {SanityDocument} from '@sanity/types'
import {APIConfig, Migration, MigrationProgress} from '../types'
import {fromExportEndpoint, safeJsonParser} from '../sources/fromExportEndpoint'
import {streamToAsyncIterator} from '../utils/streamToAsyncIterator'
import {bufferThroughFile} from '../fs-webstream/bufferThroughFile'
import {asyncIterableToStream} from '../utils/asyncIterableToStream'
import {tap} from '../it-utils/tap'
import {parse, stringify} from '../it-utils/ndjson'
import {decodeText, toArray} from '../it-utils'
import {collectMigrationMutations} from './collectMigrationMutations'
import {getBufferFilePath} from './utils/getBufferFile'
import {createBufferFileContext} from './utils/createBufferFileContext'
import {applyFilters} from './utils/applyFilters'

interface MigrationRunnerOptions {
  api: APIConfig
  onProgress?: (event: MigrationProgress) => void
}

export async function dryRun(config: MigrationRunnerOptions, migration: Migration) {
  const stats: MigrationProgress = {
    documents: 0,
    mutations: 0,
    pending: 0,
    queuedBatches: 0,
    completedTransactions: [],
    currentTransactions: [],
  }

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
    asyncIterableToStream(stringify(filteredDocuments)),
    getBufferFilePath(),
    {signal: abortController.signal},
  )

  const context = createBufferFileContext(createReader)

  const mutations = tap(
    collectMigrationMutations(
      migration,
      () => parse(decodeText(streamToAsyncIterator(createReader())), {parse: safeJsonParser}),
      context,
    ),
    (muts) => {
      stats.currentTransactions = arrify(muts)
      config.onProgress?.({
        ...stats,
        mutations: ++stats.mutations,
      })
    },
  )

  // yield *
  //   collectMigrationMutations(
  //     migration,
  //     () => parse(decodeText(streamToAsyncIterator(createReader())), {parse: safeJsonParser}),
  //     context,
  //   )

  for await (const mutation of await toArray(mutations)) {
    config.onProgress?.({
      ...stats,
    })
  }

  config.onProgress?.({
    ...stats,
    done: true,
  })
  // stop buffering the export once we're done collecting all mutations
  abortController.abort()
}
