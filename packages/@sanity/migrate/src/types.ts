import {type MultipleMutationResult, type Mutation as RawMutation} from '@sanity/client'
import {type Path, type SanityDocument} from '@sanity/types'

import {type JsonArray, type JsonObject, type JsonValue} from './json'
import {type Mutation, type NodePatch, type Operation, type Transaction} from './mutations'
import {type RestrictedClient} from './runner/utils/createContextClient'

export type {Path}
export type * from './json'

export type AsyncIterableMigration = (
  documents: () => AsyncIterableIterator<SanityDocument>,
  context: MigrationContext,
) => AsyncGenerator<Mutation | Transaction | (Mutation | Transaction)[]>

/**
 * @public
 *
 * Main interface for a content migration definition
 * {@link https://www.sanity.io/docs/schema-and-content-migrations#af2be129ccd6}
 */
export interface Migration<Def extends MigrateDefinition = MigrateDefinition> {
  /**
   * A reader-friendly description of what the content migration does
   */
  title: string

  /**
   * An array of document types to run the content migration on. If you don’t define this, the migration type will target all document types.
   * Note: This reflects the document types your migration will be based on, not necessarily the documents you will modify.
   */
  documentTypes?: string[]

  /**
   * A simple GROQ-filter (doesn’t support joins) for documents you want to run the content migration on.
   * Note: instead of adding `_type == 'yourType'` to the filter, it's better to add its `_type` to `documentTypes`.
   * Note: `documentTypes` and `filter` are combined with AND. This means a document will only be included in the
   * migration if its `_type` matches any of the provided `documentTypes` AND it also matches the `filter` (if provided).
   */
  filter?: string

  /**
   * An object of named helper functions corresponding to the primary schema type of the content you want to migrate.
   * You can also run these functions as async and return the migration instructions as promises if you need to fetch data from elsewhere.
   * If you want more control, `migrate` can also be an async iterable function that yields mutations or transactions.
   * {@link NodeMigration}
   * {@link AsyncIterableMigration}
   *
   */
  migrate: Def
}

/**
 * @public
 *
 * Migration context. This will be passed to both async iterable migrations and node migration helper functions
 */
export interface MigrationContext {
  client: RestrictedClient
  filtered: {
    getDocument<T extends SanityDocument>(id: string): Promise<T | undefined>
    getDocuments<T extends SanityDocument>(ids: string[]): Promise<T[]>
  }
  dryRun: boolean
}

/**
 * @public
 *
 * Interface for `Migration['migrate']`. Either a NodeMigration or an AsyncIterableMigration
 * {@link NodeMigration}
 * {@link AsyncIterableMigration}
 */
export type MigrateDefinition = NodeMigration | AsyncIterableMigration

/**
 * Migration progress, only used internally (for now)
 * @internal
 * @hidden
 */
export type MigrationProgress = {
  documents: number
  mutations: number
  pending: number
  queuedBatches: number
  currentTransactions: (Transaction | Mutation)[]
  completedTransactions: MultipleMutationResult[]
  done?: boolean
}

/**
 * API configuration for the migration runner
 * @internal
 * @hidden
 */
export interface APIConfig {
  projectId: string
  apiVersion: `vX` | `v${number}-${number}-${number}`
  token: string
  dataset: string
  apiHost?: string
}

/**
 * API configuration for exports
 * @internal
 * @hidden
 */
export interface ExportAPIConfig extends APIConfig {
  documentTypes?: string[]
}

/**
 * @public
 *
 * Possible return values from a migration helper that runs on a document as a whole
 * Currently, this is only applies to {@link NodeMigration.document}
 */
export type DocumentMigrationReturnValue =
  | Mutation
  | Mutation[]
  | NodePatch
  | NodePatch[]
  | RawMutation
  | RawMutation[]

/**
 * @public
 *
 * Possible return values from a migration helper that runs on nodes within a document
 */
export type NodeMigrationReturnValue = DocumentMigrationReturnValue | Operation | Operation[]

/**
 * @public
 *
 * Node migration helper functions. As the migration is processing a document, it will visit each node in the document, depth-first, call the appropriate helper function for the node type and collect any mutations returned from it.
 */
export interface NodeMigration {
  /**
   * Helper function for migrating a document as a whole
   * @param doc - The document currently being processed
   * @param context - The {@link MigrationContext} instance
   */
  document?: <Doc extends SanityDocument>(
    doc: Doc,
    context: MigrationContext,
  ) =>
    | void
    | DocumentMigrationReturnValue
    | Transaction
    | Promise<DocumentMigrationReturnValue | Transaction>

  /**
   * Helper function that will be called for each node in each document included in the migration
   * @param node - The node currently being visited
   * @param path - The path to the node within the document. See {@link Path}
   * @param context - The {@link MigrationContext} instance
   */
  node?: <Node extends JsonValue>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>

  /**
   * Helper function that will be called for each object in each document included in the migration
   * @param object - The object value currently being visited
   * @param path - The path to the node within the document. See {@link Path}
   * @param context - The {@link MigrationContext} instance
   */
  object?: <Node extends JsonObject>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>

  /**
   * Helper function that will be called for each array in each document included in the migration
   * @param object - The object value currently being visited
   * @param path - The path to the node within the document. See {@link Path}
   * @param context - The {@link MigrationContext} instance
   */
  array?: <Node extends JsonArray>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>

  /**
   * Helper function that will be called for each string in each document included in the migration
   * @param string - The string value currently being visited
   * @param path - The path to the node within the document. See {@link Path}
   * @param context - The {@link MigrationContext} instance
   */
  string?: <Node extends string>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>

  /**
   * Helper function that will be called for each number in each document included in the migration
   * @param string - The string value currently being visited
   * @param path - The path to the node within the document. See {@link Path}
   * @param context - The {@link MigrationContext} instance
   */
  number?: <Node extends number>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>

  /**
   * Helper function that will be called for each boolean value in each document included in the migration
   * @param string - The string value currently being visited
   * @param path - The path to the node within the document. See {@link Path}
   * @param context - The {@link MigrationContext} instance
   */
  boolean?: <Node extends boolean>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>

  /**
   * Helper function that will be called for each `null` value in each document included in the migration
   * @param string - The string value currently being visited
   * @param path - The path to the node within the document. See {@link Path}
   * @param context - The {@link MigrationContext} instance
   */
  null?: <Node extends null>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>
}
