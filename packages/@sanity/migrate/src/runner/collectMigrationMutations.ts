import {type SanityDocument} from '@sanity/types'

import {type Migration, type MigrationContext} from '../types'
import {normalizeMigrateDefinition} from './normalizeMigrateDefinition'

export function collectMigrationMutations(
  migration: Migration,
  documents: () => AsyncIterableIterator<SanityDocument>,
  context: MigrationContext,
) {
  const migrate = normalizeMigrateDefinition(migration)
  return migrate(documents, context)
}
