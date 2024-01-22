import {SanityDocument} from '@sanity/types'
import {MultipleMutationResult, Mutation as SanityMutation} from '@sanity/client'
import {APIConfig, Migration} from '../types'
import {ndjson} from '../it-utils/ndjson'
import {fromExportEndpoint, safeJsonParser} from '../sources/fromExportEndpoint'
import {endpoints} from '../fetch-utils/endpoints'
import {toFetchOptions} from '../fetch-utils/sanityRequestOptions'
import {commitMutations} from '../destinations/commitMutations'
import {collectMigrationMutations} from './collectMigrationMutations'
import {batchMutations} from './utils/batchMutations'
import {DEFAULT_MUTATION_CONCURRENCY, MUTATION_ENDPOINT_MAX_BODY_SIZE} from './constants'
import {toSanityMutations} from './utils/toSanityMutations'

interface MigrationRunnerOptions {
  api: APIConfig
  concurrency?: number
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
export async function* run(config: MigrationRunnerOptions, migration: Migration) {
  const mutations = collectMigrationMutations(
    migration,
    ndjson<SanityDocument>(await fromExportEndpoint(config.api), {
      parse: safeJsonParser,
    }),
  )

  const concurrency = Math.min(
    DEFAULT_MUTATION_CONCURRENCY,
    config?.concurrency ?? DEFAULT_MUTATION_CONCURRENCY,
  )

  const batches = batchMutations(toSanityMutations(mutations), MUTATION_ENDPOINT_MAX_BODY_SIZE)

  const commits = await commitMutations(toFetchOptionsIterable(config.api, batches), {concurrency})

  for await (const result of commits) {
    yield formatMutationResponse(result)
  }
}

function formatMutationResponse(mutationResponse: MultipleMutationResult) {
  return `OK (transactionId = ${mutationResponse.transactionId})
${mutationResponse.results
  .map((result) => {
    return ` - ${result.operation}: ${result.id}`
  })
  .join('\n')}`
}
