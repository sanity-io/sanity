import {APIConfig, Migration} from '../types'
import {ndjson} from '../it-utils/ndjson'
import {fromExportEndpoint} from '../sources/fromExportEndpoint'
import {toMutationEndpoint} from '../targets/toMutationEndpoint'

interface MigrationRunnerOptions {
  api: APIConfig
}

export async function run(config: MigrationRunnerOptions, migration: Migration) {
  const ctx = {
    withDocument: () => {
      throw new Error('Not implemented yet')
    },
  }
  const mutations = migration.run(ndjson(await fromExportEndpoint(config.api)), ctx)

  return toMutationEndpoint(config.api, mutations)
}
