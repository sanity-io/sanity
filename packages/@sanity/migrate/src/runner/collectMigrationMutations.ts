import {type SanityDocument} from '@sanity/types'

import {type Migration, type MigrationContext} from '../types'
import {normalizeMigrateDefinition} from './normalizeMigrateDefinition'

async function* empty() {}

function wrapDocumentsIteratorProducer(factory: () => AsyncIterableIterator<SanityDocument>) {
  function documents() {
    return factory()
  }

  ;(documents as any)[Symbol.asyncIterator] = () => {
    throw new Error(
      `The migration is attempting to iterate over the "documents" function, please call the function instead:

      // BAD:
      for await (const document of documents) {
        // ...
      }

      // GOOD:                        👇 This is a function and has to be called
      for await (const document of documents()) {
        // ...
      }
      `,
    )
  }
  return documents
}

export function collectMigrationMutations(
  migration: Migration,
  documents: () => AsyncIterableIterator<SanityDocument>,
  context: MigrationContext,
) {
  const migrate = normalizeMigrateDefinition(migration)
  return migrate(wrapDocumentsIteratorProducer(documents), context)
}
