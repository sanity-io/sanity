import {SanityDocument} from '@sanity/types'
import {MultipleMutationResult} from '@sanity/client'
import {APIConfig, Migration} from '../types'
import {ndjson} from '../it-utils/ndjson'
import {fromExportEndpoint, safeJsonParser} from '../sources/fromExportEndpoint'
import {toMutationEndpoint} from '../destinations/toMutationEndpoint'
import {collectMigrationMutations} from './collectMigrationMutations'

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

  for await (const result of toMutationEndpoint(config.api, mutations)) {
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
