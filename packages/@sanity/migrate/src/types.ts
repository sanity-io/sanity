import type {SanityDocument, Path} from '@sanity/types'
import {MultipleMutationResult} from '@sanity/client'
import {JsonArray, JsonObject, JsonValue} from './json'
import {Mutation, NodePatch, Operation} from './mutations'

export type {Path}
export type * from './json'

export type AsyncIterableMigration = (
  documents: () => AsyncIterableIterator<SanityDocument>,
  context: MigrationContext,
) => AsyncGenerator<Mutation | Mutation[]>

export interface Migration<Def extends MigrateDefinition = MigrateDefinition> {
  name: string
  /**
   * Define input for the migration. If the migration uses an existing set of documents as starting point, define the filter here.
   */
  filter?: string

  /**
   * What document types to migrate
   */
  documentTypes?: string[]

  migrate: Def
}

export type MigrateDefinition = NodeMigration | AsyncIterableMigration

export type MigrationProgress = {
  documents: number
  mutations: number
  pending: number
  queuedBatches: number
  currentMutations: Mutation[]
  completedTransactions: MultipleMutationResult[]
  done?: boolean
}

export interface MigrationContext {
  getDocument<T extends SanityDocument>(id: string): Promise<T | undefined>
  getDocuments<T extends SanityDocument>(ids: string[]): Promise<T[]>
  query<T>(query: string, params?: Record<string, unknown>): Promise<T>
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
  | undefined
  | Mutation
  | Mutation[]
  | NodePatch
  | NodePatch[]

export type NodeMigrationReturnValue = DocumentMigrationReturnValue | Operation | Operation[]

export interface NodeMigration {
  document?: <Doc extends SanityDocument>(
    doc: Doc,
    context: MigrationContext,
  ) => DocumentMigrationReturnValue | Promise<DocumentMigrationReturnValue>
  node?: <Node extends JsonValue>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => NodeMigrationReturnValue | Promise<NodeMigrationReturnValue>
  object?: <Node extends JsonObject>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => NodeMigrationReturnValue | Promise<NodeMigrationReturnValue>
  array?: <Node extends JsonArray>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => NodeMigrationReturnValue | Promise<NodeMigrationReturnValue>
  string?: <Node extends string>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => NodeMigrationReturnValue | Promise<NodeMigrationReturnValue>
  number?: <Node extends number>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => NodeMigrationReturnValue | Promise<NodeMigrationReturnValue>
  boolean?: <Node extends boolean>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => NodeMigrationReturnValue | Promise<NodeMigrationReturnValue>
  null?: <Node extends null>(
    node: Node,
    path: Path,
    context: MigrationContext,
  ) => NodeMigrationReturnValue | Promise<NodeMigrationReturnValue>
}
