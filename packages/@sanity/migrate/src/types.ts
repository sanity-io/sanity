import type {SanityDocument} from '@sanity/types'
import type {Mutation, NodePatch, Operation, Path} from '@bjoerge/mutiny'
import {JsonArray, JsonObject, JsonValue} from 'type-fest'

export type {Path}

export type MigrationRunner = (
  documents: AsyncIterableIterator<SanityDocument>,
  context: MigrationContext,
) => AsyncGenerator<Mutation | Mutation[]>

export interface Migration {
  name: string
  /**
   * Define input for the migration. If the migration uses an existing set of documents as starting point, define the filter here.
   */
  input?: {
    filter: string
  }
  run: MigrationRunner
}

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

export interface NodeMigration {
  name: string
  /**
   * Define input for the migration. If the migration uses an existing set of documents as starting point, define the filter here.
   */
  input?: {
    filter: string
  }
  node?: <Node extends JsonValue>() => undefined | Node | Operation | NodePatch[]
  object?: <Node extends JsonObject>(
    node: Node,
    path: Path,
    context: NodeMigrationContext,
  ) => void | Operation | Operation[] | NodePatch | NodePatch[]
  array?: <Node extends JsonArray>(
    node: Node,
    path: Path,
    context: NodeMigrationContext,
  ) => void | Operation | Operation[] | NodePatch | NodePatch[]
  string?: <Node extends string>(
    node: Node,
    path: Path,
    context: NodeMigrationContext,
  ) => void | Operation | Operation[] | NodePatch | NodePatch[]
  number?: <Node extends boolean>(
    node: Node,
    path: Path,
    context: NodeMigrationContext,
  ) => void | Operation | Operation[] | NodePatch | NodePatch[]
  boolean?: <Node extends boolean>(
    node: Node,
    path: Path,
    context: NodeMigrationContext,
  ) => void | Operation | Operation[] | NodePatch | NodePatch[]
}
