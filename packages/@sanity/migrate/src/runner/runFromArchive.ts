import {SanityDocument} from '@sanity/types'
import arrify from 'arrify'
import {Migration, MigrationProgress} from '../types'
import {decodeText} from '../it-utils'
import {fromExportArchive} from '../sources/fromExportArchive'
import {bufferThroughFile} from '../fs-webstream/bufferThroughFile'
import {tap} from '../it-utils/tap'
import {streamToAsyncIterator} from '../utils/streamToAsyncIterator'
import {mapAsync} from '../it-utils/mapAsync'
import {asyncIterableToStream} from '../utils/asyncIterableToStream'
import {safeJsonParser} from '../sources/fromExportEndpoint'
import {parse, stringify} from '../it-utils/ndjson'
import {toSanityMutations} from './utils/toSanityMutations'
import {batchMutations} from './utils/batchMutations'
import {
  DEFAULT_MUTATION_CONCURRENCY,
  MAX_MUTATION_CONCURRENCY,
  MUTATION_ENDPOINT_MAX_BODY_SIZE,
} from './constants'
import {createBufferFileContext} from './utils/createBufferFileContext'
import {getBufferFilePath} from './utils/getBufferFile'
import {collectMigrationMutations} from './collectMigrationMutations'
import {MigrationRunnerConfig, toFetchOptionsIterable} from './run'
import {applyFilters} from './utils/applyFilters'

export async function runFromArchive(
  migration: Migration,
  path: string,
  config: MigrationRunnerConfig,
) {
  const stats: MigrationProgress = {
    documents: 0,
    mutations: 0,
    pending: 0,
    queuedBatches: 0,
    completedTransactions: [],
    currentMutations: [],
  }

  const filteredDocuments = applyFilters(
    migration,
    parse<SanityDocument>(decodeText(fromExportArchive(path)), {
      parse: safeJsonParser,
    }),
  )
  const abortController = new AbortController()

  const createReader = bufferThroughFile(
    asyncIterableToStream(stringify(filteredDocuments)),
    getBufferFilePath(),
    {signal: abortController.signal},
  )

  const context = createBufferFileContext(createReader)

  const documents = () =>
    tap(
      parse<SanityDocument>(decodeText(streamToAsyncIterator(createReader())), {
        parse: safeJsonParser,
      }),
      () => {
        config.onProgress?.({...stats, documents: ++stats.documents})
      },
    )

  const mutations = tap(collectMigrationMutations(migration, documents, context), (muts) => {
    stats.currentMutations = arrify(muts)
    config.onProgress?.({
      ...stats,
      mutations: ++stats.mutations,
    })
  })

  const batches = tap(
    batchMutations(toSanityMutations(mutations), MUTATION_ENDPOINT_MAX_BODY_SIZE),
    () => {
      config.onProgress?.({...stats, queuedBatches: ++stats.queuedBatches})
    },
  )

  const concurrency = config?.concurrency ?? DEFAULT_MUTATION_CONCURRENCY

  if (concurrency > MAX_MUTATION_CONCURRENCY) {
    throw new Error(`Concurrency exceeds maximum allowed value (${MAX_MUTATION_CONCURRENCY})`)
  }

  const commits = await mapAsync(
    toFetchOptionsIterable(config.api, batches),
    (opts) => {
      config.onProgress?.({...stats, pending: ++stats.pending})
      return Promise.resolve()
    },
    concurrency,
  )
  for await (const result of commits) {
    config.onProgress?.({
      ...stats,
    })
  }
  // Cancel export/buffer stream, it's not needed anymore
  abortController.abort()
  config.onProgress?.({
    ...stats,
    done: true,
  })
}
