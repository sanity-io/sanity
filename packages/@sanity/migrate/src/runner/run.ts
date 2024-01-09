import {SanityDocument} from '@sanity/types'
import {MultipleMutationResult} from '@sanity/client'
import {APIConfig, Migration} from '../types'
import {ndjson} from '../it-utils/ndjson'
import {fromExportEndpoint} from '../sources/fromExportEndpoint'
import {toMutationEndpoint} from '../targets/toMutationEndpoint'

interface MigrationRunnerOptions {
  api: APIConfig
}

export async function* run(config: MigrationRunnerOptions, migration: Migration) {
  const ctx = {
    withDocument: () => {
      throw new Error('Not implemented yet')
    },
  }
  const mutations = migration.run(
    ndjson(await fromExportEndpoint(config.api)) as AsyncIterableIterator<SanityDocument>,
    ctx,
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
