import {SanityDocument} from '@sanity/types'
import {Migration} from '../types'
import {normalizeMigrateDefinition} from './normalizeMigrateDefinition'

export function collectMigrationMutations(
  migration: Migration,
  documents: AsyncIterableIterator<SanityDocument>,
) {
  const ctx = {
    withDocument: () => {
      throw new Error('Not implemented yet')
    },
  }
  const migrate = normalizeMigrateDefinition(migration)
  return migrate(documents, ctx)
}
