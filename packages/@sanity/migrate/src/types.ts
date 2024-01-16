import type {SanityDocument} from '@sanity/types'
import type {Mutation, NodePatch, Operation, Path} from '@bjoerge/mutiny'
import {JsonArray, JsonObject, JsonValue} from './json'

export type {Path}
export type * from './json'

export type AsyncIterableMigration = (
  documents: AsyncIterableIterator<SanityDocument>,
  context: MigrationContext,
) => AsyncGenerator<Mutation | Mutation[]>

export interface Migration<Def extends MigrateDefinition = MigrateDefinition> {
  name: string
  /**
   * Define input for the migration. If the migration uses an existing set of documents as starting point, define the filter here.
   */
  filter?: string
  documentType: string
  migrate: Def
}

export type MigrateDefinition = NodeMigration | AsyncIterableMigration

export interface MigrationContext {
  withDocument(id: string): Promise<SanityDocument | null>
}

export interface APIConfig {
  projectId: string
  apiVersion: `vX` | `v${number}-${number}-${number}`
  token: string
  dataset: string
  apiHost?: string
}

export interface NodeMigrationContext {
  withDocument(id: string): Promise<SanityDocument | null>
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
    context: NodeMigrationContext,
  ) => DocumentMigrationReturnValue
  node?: <Node extends JsonValue>(
    node: Node,
    path: Path,
    context: NodeMigrationContext,
  ) => NodeMigrationReturnValue
  object?: <Node extends JsonObject>(
    node: Node,
    path: Path,
    context: NodeMigrationContext,
  ) => NodeMigrationReturnValue
  array?: <Node extends JsonArray>(
    node: Node,
    path: Path,
    context: NodeMigrationContext,
  ) => NodeMigrationReturnValue
  string?: <Node extends string>(
    node: Node,
    path: Path,
    context: NodeMigrationContext,
  ) => NodeMigrationReturnValue
  number?: <Node extends number>(
    node: Node,
    path: Path,
    context: NodeMigrationContext,
  ) => NodeMigrationReturnValue
  boolean?: <Node extends boolean>(
    node: Node,
    path: Path,
    context: NodeMigrationContext,
  ) => NodeMigrationReturnValue
  null?: <Node extends null>(
    node: Node,
    path: Path,
    context: NodeMigrationContext,
  ) => NodeMigrationReturnValue
}
