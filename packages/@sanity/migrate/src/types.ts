import type {SanityDocument} from '@sanity/types'
import type {Mutation} from '@bjoerge/mutiny'

export type MigrationRunner = (
  documents: AsyncIterableIterator<SanityDocument>,
  context: MigrationContext,
) => AsyncGenerator<Mutation | Mutation[]>

export interface Migration {
  /**
   * Define input for the migration. If the migration uses an existing set of documents as starting point, define the filter here.
   */
  input?: {
    filter: string
  }
  run: MigrationRunner
}

interface MigrationContext {
  withDocument(id: string): Promise<SanityDocument | null>
}

export interface APIConfig {
  projectId: string
  apiVersion: `vX` | `v${number}-${number}-${number}`
  token: string
  dataset: string
  apiHost?: string
}
