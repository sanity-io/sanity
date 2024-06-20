import {type MultipleMutationResult} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import arrify from 'arrify'

import {endpoints} from '../fetch-utils/endpoints'
import {fetchAsyncIterator, type FetchOptions} from '../fetch-utils/fetchStream'
import {toFetchOptions} from '../fetch-utils/sanityRequestOptions'
import {bufferThroughFile} from '../fs-webstream/bufferThroughFile'
import {decodeText, parseJSON} from '../it-utils'
import {concatStr} from '../it-utils/concatStr'
import {lastValueFrom} from '../it-utils/lastValueFrom'
import {mapAsync} from '../it-utils/mapAsync'
import {parse, stringify} from '../it-utils/ndjson'
import {tap} from '../it-utils/tap'
import {fromExportEndpoint, safeJsonParser} from '../sources/fromExportEndpoint'
import {
  type APIConfig,
  type Migration,
  type MigrationContext,
  type MigrationProgress,
} from '../types'
import {asyncIterableToStream} from '../utils/asyncIterableToStream'
import {streamToAsyncIterator} from '../utils/streamToAsyncIterator'
import {collectMigrationMutations} from './collectMigrationMutations'
import {
  DEFAULT_MUTATION_CONCURRENCY,
  MAX_MUTATION_CONCURRENCY,
  MUTATION_ENDPOINT_MAX_BODY_SIZE,
} from './constants'
import {applyFilters} from './utils/applyFilters'
import {batchMutations} from './utils/batchMutations'
import {createContextClient} from './utils/createContextClient'
import {createFilteredDocumentsClient} from './utils/createFilteredDocumentsClient'
import {createBufferFile} from './utils/getBufferFile'
import {toSanityMutations, type TransactionPayload} from './utils/toSanityMutations'

export interface MigrationRunnerConfig {
  api: APIConfig
  concurrency?: number
  onProgress?: (event: MigrationProgress) => void
}

export async function* toFetchOptionsIterable(
  apiConfig: APIConfig,
  mutations: AsyncIterableIterator<TransactionPayload>,
) {
  for await (const transaction of mutations) {
    yield toFetchOptions({
      projectId: apiConfig.projectId,
      apiVersion: apiConfig.apiVersion,
      token: apiConfig.token,
      tag: 'sanity.migration.mutate',
      apiHost: apiConfig.apiHost ?? 'api.sanity.io',
      endpoint: endpoints.data.mutate(apiConfig.dataset, {
        returnIds: true,
        visibility: 'async',
        autoGenerateArrayKeys: true,
      }),
      body: JSON.stringify(transaction),
    })
  }
}

export async function run(config: MigrationRunnerConfig, migration: Migration) {
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
    await createBufferFile(),
    {signal: abortController.signal},
  )

  const client = createContextClient({
    ...config.api,
    useCdn: false,
    requestTagPrefix: 'sanity.migration',
  })

  const filteredDocumentsClient = createFilteredDocumentsClient(createReader)
  const context: MigrationContext = {
    client,
    filtered: filteredDocumentsClient,
    dryRun: false,
  }

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
    stats.currentTransactions = arrify(muts)
    config.onProgress?.({
      ...stats,
      mutations: ++stats.mutations,
    })
  })

  const concurrency = config?.concurrency ?? DEFAULT_MUTATION_CONCURRENCY

  if (concurrency > MAX_MUTATION_CONCURRENCY) {
    throw new Error(`Concurrency exceeds maximum allowed value (${MAX_MUTATION_CONCURRENCY})`)
  }

  const batches = tap(
    batchMutations(toSanityMutations(mutations), MUTATION_ENDPOINT_MAX_BODY_SIZE),
    () => {
      config.onProgress?.({...stats, queuedBatches: ++stats.queuedBatches})
    },
  )

  const submit = async (opts: FetchOptions): Promise<MultipleMutationResult> =>
    lastValueFrom(parseJSON(concatStr(decodeText(await fetchAsyncIterator(opts)))))

  const commits = await mapAsync(
    toFetchOptionsIterable(config.api, batches),
    (opts) => {
      config.onProgress?.({...stats, pending: ++stats.pending})
      return submit(opts)
    },
    concurrency,
  )

  for await (const result of commits) {
    stats.completedTransactions.push(result)
    config.onProgress?.({
      ...stats,
    })
  }
  config.onProgress?.({
    ...stats,
    done: true,
  })

  // Cancel export/buffer stream, it's not needed anymore
  abortController.abort()
}
