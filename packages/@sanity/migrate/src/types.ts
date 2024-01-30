import type {Path, SanityDocument} from '@sanity/types'
import {MultipleMutationResult, Mutation as RawMutation, SanityClient} from '@sanity/client'
import {JsonArray, JsonObject, JsonValue} from './json'
import {Mutation, NodePatch, Operation, Transaction} from './mutations'

export type {Path}
export type * from './json'

export type AsyncIterableMigration = (
  documents: () => AsyncIterableIterator<SanityDocument>,
  context: MigrationContext,
) => AsyncGenerator<Mutation | Transaction | (Mutation | Transaction)[]>

export interface Migration<Def extends MigrateDefinition = MigrateDefinition> {
  /**
   * The title of the migration
   */
  title: string

  /**
   * What document types to use in the migration
   */
  documentTypes?: string[]

  /**
   * What document types to use in the migration
   */
  filter?: string

  /**
   * The actual migration. This can be either a function that returns an async iterable, or an object with hooks for different node types.
   * Currently only "json"-type hooks are supported
   */
  migrate: Def
}

export type MigrateDefinition = NodeMigration | AsyncIterableMigration

export type MigrationProgress = {
  documents: number
  mutations: number
  pending: number
  queuedBatches: number
  currentTransactions: (Transaction | Mutation)[]
  completedTransactions: MultipleMutationResult[]
  done?: boolean
}

export interface MigrationContext {
  client: SanityClient
  filtered: {
    getDocument<T extends SanityDocument>(id: string): Promise<T | undefined>
    getDocuments<T extends SanityDocument>(ids: string[]): Promise<T[]>
  }
}

export interface APIConfig {
  projectId: string
  apiVersion: `vX` | `v${number}-${number}-${number}`
  token: string
  dataset: string
  apiHost?: string
}

export interface ExportAPIConfig extends APIConfig {
  documentTypes?: string[]
}

export type DocumentMigrationReturnValue =
  | Mutation
  | Mutation[]
  | NodePatch
  | NodePatch[]
  | RawMutation
  | RawMutation[]

export type NodeMigrationReturnValue = DocumentMigrationReturnValue | Operation | Operation[]

export interface NodeMigration {
  document?: <Doc extends SanityDocument>(
    doc: Doc,
    context: MigrationContext,
  ) =>
    | void
    | DocumentMigrationReturnValue
    | Transaction
    | Promise<DocumentMigrationReturnValue | Transaction>
  node?: <Node extends JsonValue>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>
  object?: <Node extends JsonObject>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>
  array?: <Node extends JsonArray>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>
  string?: <Node extends string>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>
  number?: <Node extends number>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>
  boolean?: <Node extends boolean>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>
  null?: <Node extends null>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => void | NodeMigrationReturnValue | Promise<void | NodeMigrationReturnValue>
}
