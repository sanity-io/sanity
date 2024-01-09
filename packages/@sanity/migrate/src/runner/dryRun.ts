import {CompactFormatter} from '@bjoerge/mutiny'
import {SanityDocument} from '@sanity/types'
import {APIConfig, Migration} from '../types'
import {ndjson} from '../it-utils/ndjson'
import {fromExportEndpoint} from '../sources/fromExportEndpoint'

interface MigrationRunnerOptions {
  api: APIConfig
}

export async function* dryRun(config: MigrationRunnerOptions, migration: Migration) {
  const ctx = {
    withDocument: () => {
      throw new Error('Not implemented yet')
    },
  }

  const mutations = migration.run(
    ndjson(await fromExportEndpoint(config.api)) as AsyncIterableIterator<SanityDocument>,
    ctx,
  )

  for await (const mutation of mutations) {
    if (!mutation) continue
    yield CompactFormatter.format(Array.isArray(mutation) ? mutation : [mutation])
  }
}
