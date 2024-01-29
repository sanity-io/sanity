import {SanityDocument} from '@sanity/types'
import {MultipleMutationResult, Mutation as SanityMutation} from '@sanity/client'
import {Mutation} from '@bjoerge/mutiny'
import arrify from 'arrify'
import {APIConfig, Migration} from '../types'
import {parse} from '../it-utils/ndjson'
import {fromExportEndpoint, safeJsonParser} from '../sources/fromExportEndpoint'
import {endpoints} from '../fetch-utils/endpoints'
import {toFetchOptions} from '../fetch-utils/sanityRequestOptions'
import {tap} from '../it-utils/tap'
import {mapAsync} from '../it-utils/mapAsync'
import {lastValueFrom} from '../it-utils/lastValueFrom'
import {decodeText, parseJSON} from '../it-utils'
import {concatStr} from '../it-utils/concatStr'
import {fetchAsyncIterator, FetchOptions} from '../fetch-utils/fetchStream'
import {bufferThroughFile} from '../fs-webstream/bufferThroughFile'
import {streamToAsyncIterator} from '../utils/streamToAsyncIterator'
import {toSanityMutations} from './utils/toSanityMutations'
import {
  DEFAULT_MUTATION_CONCURRENCY,
  MAX_MUTATION_CONCURRENCY,
  MUTATION_ENDPOINT_MAX_BODY_SIZE,
} from './constants'
import {batchMutations} from './utils/batchMutations'
import {collectMigrationMutations} from './collectMigrationMutations'
import {getBufferFilePath} from './utils/getBufferFile'

type MigrationProgress = {
  documents: number
  mutations: number
  pending: number
  queuedBatches: number
  currentMutations: Mutation[]
  completedTransactions: MultipleMutationResult[]
  done?: boolean
}
interface MigrationRunnerOptions {
  api: APIConfig
  concurrency?: number
  onProgress?: (event: MigrationProgress) => void
}

export async function* toFetchOptionsIterable(
  apiConfig: APIConfig,
  mutations: AsyncIterableIterator<SanityMutation[]>,
) {
  for await (const mut of mutations) {
    yield toFetchOptions({
      projectId: apiConfig.projectId,
      apiVersion: apiConfig.apiVersion,
      token: apiConfig.token,
      apiHost: apiConfig.apiHost ?? 'api.sanity.io',
      endpoint: endpoints.data.mutate(apiConfig.dataset, {returnIds: true}),
      body: JSON.stringify({mutations: mut}),
    })
  }
}
export async function run(config: MigrationRunnerOptions, migration: Migration) {
  const stats: MigrationProgress = {
    documents: 0,
    mutations: 0,
    pending: 0,
    queuedBatches: 0,
    completedTransactions: [],
    currentMutations: [],
  }

  const exportStream = bufferThroughFile(
    await fromExportEndpoint({...config.api, documentTypes: migration.documentTypes}),
    getBufferFilePath(),
  )

  const documents = tap(
    parse<SanityDocument>(streamToAsyncIterator(exportStream), {parse: safeJsonParser}),
    () => {
      config.onProgress?.({...stats, documents: ++stats.documents})
    },
  )

  const mutations = tap(collectMigrationMutations(migration, documents), (muts) => {
    stats.currentMutations = arrify(muts)
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
  // Cancel export/buffer stream, it's not needed anymore
  await exportStream.cancel()
  config.onProgress?.({
    ...stats,
    done: true,
  })
}
