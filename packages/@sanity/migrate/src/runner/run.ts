import {SanityDocument} from '@sanity/types'
import {MultipleMutationResult} from '@sanity/client'
import {APIConfig, Migration} from '../types'
import {ndjson} from '../it-utils/ndjson'
import {fromExportEndpoint, safeJsonParser} from '../sources/fromExportEndpoint'
import {toMutationEndpoint} from '../destinations/toMutationEndpoint'
import {collectMigrationMutations} from './collectMigrationMutations'
import {batchMutations} from './utils/batchMutations'
import {MUTATION_ENDPOINT_MAX_BODY_SIZE} from './constants'
import {toSanityMutations} from './utils/toSanityMutations'

interface MigrationRunnerOptions {
  api: APIConfig
}

export async function* run(config: MigrationRunnerOptions, migration: Migration) {
  const mutations = collectMigrationMutations(
    migration,
    ndjson<SanityDocument>(await fromExportEndpoint(config.api), {
      parse: safeJsonParser,
    }),
  )

  for await (const result of toMutationEndpoint(
    config.api,
    batchMutations(toSanityMutations(mutations), MUTATION_ENDPOINT_MAX_BODY_SIZE),
  )) {
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
