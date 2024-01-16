import {CompactFormatter} from '@bjoerge/mutiny'
import {SanityDocument} from '@sanity/types'
import {APIConfig, Migration} from '../types'
import {ndjson} from '../it-utils/ndjson'
import {fromExportEndpoint} from '../sources/fromExportEndpoint'
import {collectMigrationMutations} from './collectMigrationMutations'

interface MigrationRunnerOptions {
  api: APIConfig
}

export async function* dryRun(config: MigrationRunnerOptions, migration: Migration) {
  const mutations = collectMigrationMutations(
    migration,
    ndjson(await fromExportEndpoint(config.api)) as AsyncIterableIterator<SanityDocument>,
  )

  for await (const mutation of mutations) {
    if (!mutation) continue
    yield CompactFormatter.format(Array.isArray(mutation) ? mutation : [mutation])
  }
}
