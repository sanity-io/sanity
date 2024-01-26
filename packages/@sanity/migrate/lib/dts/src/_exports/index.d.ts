import type {KeyedSegment} from '@sanity/types'
import {MultipleMutationResult} from '@sanity/client'
import {Mutation as Mutation_2} from '@sanity/client'
import type {Path} from '@sanity/types'
import {SanityClient} from '@sanity/client'
import {SanityDocument as SanityDocument_2} from '@sanity/types'

declare const ALLOWED_PROPERTIES: readonly [
  'fetch',
  'clone',
  'config',
  'withConfig',
  'getDocument',
  'getDocuments',
  'users',
  'projects',
]

declare type AllowedMethods = (typeof ALLOWED_PROPERTIES)[number]

declare type AnyArray<T = any> = T[] | readonly T[]

export declare type AnyOp = SetOp<unknown> | SetIfMissingOp<unknown> | UnsetOp

export declare interface APIConfig {
  projectId: string
  apiVersion: `vX` | `v${number}-${number}-${number}`
  token: string
  dataset: string
  apiHost?: string
}

/**
 * Creates an `insert` operation that appends the provided items.
 * @param items - The items to append.
 * @returns An `insert` operation at the end of the array.
 * {@link https://www.sanity.io/docs/http-patches#Cw4vhD88}
 * @beta
 */
export declare function append<const Items extends AnyArray<unknown>>(
  items: Items | ArrayElement<Items>,
): InsertOp<NormalizeReadOnlyArray<Items>, 'after', -1>

declare type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

export declare type ArrayOp =
  | InsertOp<AnyArray, RelativePosition, IndexedSegment | KeyedSegment>
  | UpsertOp<AnyArray, RelativePosition, IndexedSegment | KeyedSegment>
  | ReplaceOp<AnyArray, IndexedSegment | KeyedSegment>
  | TruncateOp

export declare type AssignOp<T extends object = object> = {
  type: 'assign'
  value: T
}

export declare type AsyncIterableMigration = (
  documents: () => AsyncIterableIterator<SanityDocument_2>,
  context: MigrationContext,
) => AsyncGenerator<Mutation | Transaction | (Mutation | Transaction)[]>

/**
 * Creates a node patch at a specific path.
 * @param path - The path where the operation should be applied.
 * @param operation - The operation to be applied.
 * @returns The node patch.
 * @beta
 */
export declare function at<O extends Operation>(
  path: Path | string,
  operation: O,
): NodePatch<Path, O>

export declare function collectMigrationMutations(
  migration: Migration,
  documents: () => AsyncIterableIterator<SanityDocument_2>,
  context: MigrationContext,
): AsyncGenerator<Transaction | Mutation | (Transaction | Mutation)[], any, unknown>

/**
 * Creates a new document.
 * @param document - The document to be created.
 * @returns The mutation operation to create the document.
 * @beta
 */
export declare function create<Doc extends Optional<SanityDocument, '_id'>>(
  document: Doc,
): CreateMutation<Doc>

/**
 * Creates a document if it does not exist.
 * @param document - The document to be created.
 * @returns The mutation operation to create the document if it does not exist.
 * @beta
 */
export declare function createIfNotExists<Doc extends SanityDocument>(
  document: Doc,
): CreateIfNotExistsMutation<Doc>

export declare type CreateIfNotExistsMutation<Doc extends SanityDocument> = {
  type: 'createIfNotExists'
  document: Doc
}

export declare type CreateMutation<Doc extends Optional<SanityDocument, '_id'>> = {
  type: 'create'
  document: Doc
}

/**
 * Creates or replaces a document.
 * @param document - The document to be created or replaced.
 * @returns The mutation operation to create or replace the document.
 * @beta
 */
export declare function createOrReplace<Doc extends SanityDocument>(
  document: Doc,
): CreateOrReplaceMutation<Doc>

export declare type CreateOrReplaceMutation<Doc extends SanityDocument> = {
  type: 'createOrReplace'
  document: Doc
}

/**
 * Creates a `dec` (decrement) operation with the provided amount.
 * @param amount - The amount to decrement by.
 * @returns A `dec` operation.
 * {@link https://www.sanity.io/docs/http-patches#vIT8WWQo}
 * @beta
 */
export declare const dec: <const N extends number = 1>(amount?: N) => DecOp<N>

export declare function decodeText(
  it: AsyncIterableIterator<Uint8Array>,
): AsyncGenerator<string, void, unknown>

export declare type DecOp<Amount extends number> = {
  type: 'dec'
  amount: Amount
}

export declare const DEFAULT_MUTATION_CONCURRENCY = 6

export declare function defineMigration<T extends Migration>(migration: T): T

/**
 * Alias for delete_
 */
export declare const del: typeof delete_

export declare function delay<T>(
  it: AsyncIterableIterator<T>,
  ms: number,
): AsyncGenerator<Awaited<T>, void, unknown>

/**
 * Deletes a document.
 * @param id - The id of the document to be deleted.
 * @returns The mutation operation to delete the document.
 * @beta
 */
export declare function delete_(id: string): DeleteMutation

export declare type DeleteMutation = {
  type: 'delete'
  id: string
}

/**
 * Creates a `diffMatchPatch` operation with the provided value.
 * @param value - The value for the diff match patch operation.
 * @returns A `diffMatchPatch` operation.
 * {@link https://www.sanity.io/docs/http-patches#aTbJhlAJ}
 * @beta
 */
export declare const diffMatchPatch: (value: string) => DiffMatchPatchOp

export declare type DiffMatchPatchOp = {
  type: 'diffMatchPatch'
  value: string
}

export declare type DocumentMigrationReturnValue =
  | Mutation
  | Mutation[]
  | NodePatch
  | NodePatch[]
  | Mutation_2
  | Mutation_2[]

export declare function dryRun(
  config: MigrationRunnerOptions,
  migration: Migration,
): AsyncGenerator<Transaction | Mutation | (Transaction | Mutation)[], void, unknown>

export declare interface ExportAPIConfig extends APIConfig {
  documentTypes?: string[]
}

declare interface FetchOptions {
  url: string | URL
  init: RequestInit
}

export declare function filter<T>(
  it: AsyncIterableIterator<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
): AsyncGenerator<Awaited<T>, void, unknown>

export declare function fromDocuments(
  documents: SanityDocument_2[],
): Generator<SanityDocument_2, void, unknown>

export declare function fromExportArchive(path: string): AsyncGenerator<Uint8Array, void, unknown>

export declare function fromExportEndpoint(
  options: ExportAPIConfig,
): Promise<ReadableStream<Uint8Array>>

/**
 * Creates an `inc` (increment) operation with the provided amount.
 * @param amount - The amount to increment by.
 * @returns An `inc` operation.
 * {@link https://www.sanity.io/docs/http-patches#vIT8WWQo}
 * @beta
 */
export declare const inc: <const N extends number = 1>(amount?: N) => IncOp<N>

export declare type IncOp<Amount extends number> = {
  type: 'inc'
  amount: Amount
}

export declare type IndexedSegment = number

/**
 * Creates an `insert` operation with the provided items, position, and reference item.
 * @param items - The items to insert.
 * @param position - The position to insert at.
 * @param indexOrReferenceItem - The index or reference item to insert before or after.
 * @returns An `insert` operation.
 * {@link https://www.sanity.io/docs/http-patches#febxf6Fk}
 * @beta
 */
export declare function insert<
  const Items extends AnyArray<unknown>,
  const Pos extends RelativePosition,
  const ReferenceItem extends IndexedSegment | KeyedSegment,
>(
  items: Items | ArrayElement<Items>,
  position: Pos,
  indexOrReferenceItem: ReferenceItem,
): InsertOp<NormalizeReadOnlyArray<Items>, Pos, ReferenceItem>

/**
 * Creates an `insert` operation that inserts the provided items after the provided index or reference item.
 * @param items - The items to insert.
 * @param indexOrReferenceItem - The index or reference item to insert after.
 * @returns An `insert` operation after the provided index or reference item.
 * {@link https://www.sanity.io/docs/http-patches#0SQmPlb6}
 * @beta
 */
export declare const insertAfter: <
  const Items extends AnyArray<unknown>,
  const ReferenceItem extends number | KeyedSegment,
>(
  items: Items | ArrayElement<Items>,
  indexOrReferenceItem: ReferenceItem,
) => InsertOp<NormalizeReadOnlyArray<Items>, 'after', ReferenceItem>

/**
 * Creates an `insert` operation that inserts the provided items before the provided index or reference item.
 * @param items - The items to insert.
 * @param indexOrReferenceItem - The index or reference item to insert before.
 * @returns An `insert` operation before the provided index or reference item.
 * {@link https://www.sanity.io/docs/http-patches#0SQmPlb6}
 */
export declare function insertBefore<
  const Items extends AnyArray<unknown>,
  const ReferenceItem extends IndexedSegment | KeyedSegment,
>(
  items: Items | ArrayElement<Items>,
  indexOrReferenceItem: ReferenceItem,
): InsertOp<NormalizeReadOnlyArray<Items>, 'before', ReferenceItem>

export declare type InsertOp<
  Items extends AnyArray,
  Pos extends RelativePosition,
  ReferenceItem extends IndexedSegment | KeyedSegment,
> = {
  type: 'insert'
  referenceItem: ReferenceItem
  position: Pos
  items: Items
}

export declare type JsonArray = JsonValue[] | readonly JsonValue[]

export declare type JsonObject = {
  [Key in string]: JsonValue
} & {
  [Key in string]?: JsonValue | undefined
}

export declare interface JSONOptions<Type> {
  parse?: JSONParser<Type>
}

export declare type JSONParser<Type> = (line: string) => Type

export declare type JsonPrimitive = string | number | boolean | null

export declare type JsonValue = JsonPrimitive | JsonObject | JsonArray

export {KeyedSegment}

export declare function map<T, U>(
  it: AsyncIterableIterator<T>,
  project: (value: T) => U,
): AsyncIterableIterator<U>

export declare const MAX_MUTATION_CONCURRENCY = 10

export declare type MigrateDefinition = NodeMigration | AsyncIterableMigration

export declare interface Migration<Def extends MigrateDefinition = MigrateDefinition> {
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

export declare interface MigrationContext {
  client: RestrictedClient
  filtered: {
    getDocument<T extends SanityDocument_2>(id: string): Promise<T | undefined>
    getDocuments<T extends SanityDocument_2>(ids: string[]): Promise<T[]>
  }
}

export declare type MigrationProgress = {
  documents: number
  mutations: number
  pending: number
  queuedBatches: number
  currentTransactions: (Transaction | Mutation)[]
  completedTransactions: MultipleMutationResult[]
  done?: boolean
}

export declare interface MigrationRunnerConfig {
  api: APIConfig
  concurrency?: number
  onProgress?: (event: MigrationProgress) => void
}

declare interface MigrationRunnerOptions {
  api: APIConfig
  onProgress?: (event: MigrationProgress) => void
}

export declare type Mutation<Doc extends SanityDocument = any> =
  | CreateMutation<Doc>
  | CreateIfNotExistsMutation<Doc>
  | CreateOrReplaceMutation<Doc>
  | DeleteMutation
  | PatchMutation

export declare interface NodeMigration {
  document?: <Doc extends SanityDocument_2>(
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

export declare type NodeMigrationReturnValue =
  | DocumentMigrationReturnValue
  | Operation
  | Operation[]

export declare type NodePatch<P extends Path = Path, O extends Operation = Operation> = {
  path: P
  op: O
}

export declare type NodePatchList =
  | [NodePatch, ...NodePatch[]]
  | NodePatch[]
  | readonly NodePatch[]
  | readonly [NodePatch, ...NodePatch[]]

declare type NormalizeReadOnlyArray<T> = T extends readonly [infer NP, ...infer Rest]
  ? [NP, ...Rest]
  : T extends readonly (infer NP)[]
    ? NP[]
    : T

export declare type NumberOp = IncOp<number> | DecOp<number>

export declare type ObjectOp = AssignOp | UnassignOp

export declare type Operation = PrimitiveOp | ArrayOp | ObjectOp

declare type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export declare function parse<Type>(
  it: AsyncIterableIterator<string>,
  options?: JSONOptions<Type>,
): AsyncIterableIterator<Type>

export declare function parseJSON<Type>(
  it: AsyncIterableIterator<string>,
  {parse}?: JSONOptions<Type>,
): AsyncIterableIterator<Type>

/**
 * Applies a patch to a document.
 * @param id - The id of the document to be patched.
 * @param patches - The patches to be applied.
 * @param options - Optional patch options.
 * @returns The mutation operation to patch the document.
 * @beta
 */
export declare function patch<P extends NodePatchList | NodePatch>(
  id: string,
  patches: P,
  options?: PatchOptions,
): PatchMutation<NormalizeReadOnlyArray<Tuplify<P>>>

export declare type PatchMutation<Patches extends NodePatchList = NodePatchList> = {
  type: 'patch'
  id: string
  patches: Patches
  options?: PatchOptions
}

export declare type PatchOptions = {
  ifRevision?: string
}

export {Path}

/**
 * Creates an `insert` operation that prepends the provided items.
 * @param items - The items to prepend.
 * @returns An `insert` operation at the beginning of the array.
 * {@link https://www.sanity.io/docs/http-patches#refAUsf0}
 * @beta
 */
export declare function prepend<const Items extends AnyArray<unknown>>(
  items: Items | ArrayElement<Items>,
): InsertOp<NormalizeReadOnlyArray<Items>, 'before', 0>

export declare type PrimitiveOp = AnyOp | StringOp | NumberOp

export declare type RelativePosition = 'before' | 'after'

/**
 * Creates a `replace` operation with the provided items and reference item.
 * @param items - The items to replace.
 * @param referenceItem - The reference item to replace.
 * @returns A ReplaceOp operation.
 * @remarks This will be converted to an `insert`/`replace` patch when submitted to the API
 * {@link https://www.sanity.io/docs/http-patches#GnVSwcPa}
 * @beta
 */
export declare function replace<
  Items extends any[],
  ReferenceItem extends IndexedSegment | KeyedSegment,
>(items: Items | ArrayElement<Items>, referenceItem: ReferenceItem): ReplaceOp<Items, ReferenceItem>

export declare type ReplaceOp<
  Items extends AnyArray,
  ReferenceItem extends IndexedSegment | KeyedSegment,
> = {
  type: 'replace'
  referenceItem: ReferenceItem
  items: Items
}

declare type RestrictedClient = Pick<SanityClient, AllowedMethods>

export declare function run(config: MigrationRunnerConfig, migration: Migration): Promise<void>

export declare function runFromArchive(
  migration: Migration,
  path: string,
  config: MigrationRunnerConfig,
): Promise<void>

/**
 * Safe JSON parser that is able to handle lines interrupted by an error object.
 *
 * This may occur when streaming NDJSON from the Export HTTP API.
 *
 * @internal
 * @see {@link https://github.com/sanity-io/sanity/pull/1787 | Initial pull request}
 */
export declare const safeJsonParser: (line: string) => SanityDocument_2

export declare type SanityDocument = {
  _id?: string
  _type: string
  _createdAt?: string
  _updatedAt?: string
  _rev?: string
}

/**
 * Creates a `set` operation with the provided value.
 * @param value - The value to set.
 * @returns A `set` operation.
 * {@link https://www.sanity.io/docs/http-patches#6TPENSW3}
 * @beta
 */
export declare const set: <const T>(value: T) => SetOp<T>

/**
 * Creates a `setIfMissing` operation with the provided value.
 * @param value - The value to set if missing.
 * @returns A `setIfMissing` operation.
 * {@link https://www.sanity.io/docs/http-patches#A80781bT}
 * @beta
 */
export declare const setIfMissing: <const T>(value: T) => SetIfMissingOp<T>

export declare type SetIfMissingOp<T> = {
  type: 'setIfMissing'
  value: T
}

export declare type SetOp<T> = {
  type: 'set'
  value: T
}

export declare function split(
  it: AsyncIterableIterator<string>,
  delimiter: string,
): AsyncIterableIterator<string>

export declare function stringify(
  iterable: AsyncIterableIterator<unknown>,
): AsyncGenerator<string, void, unknown>

export declare function stringifyJSON(
  it: AsyncIterableIterator<unknown>,
): AsyncGenerator<string, void, unknown>

export declare type StringOp = DiffMatchPatchOp

export declare function take<T>(
  it: AsyncIterableIterator<T>,
  count: number,
): AsyncGenerator<Awaited<T>, void, unknown>

export declare function toArray<T>(it: AsyncIterableIterator<T>): Promise<T[]>

export declare function toFetchOptionsIterable(
  apiConfig: APIConfig,
  mutations: AsyncIterableIterator<TransactionPayload>,
): AsyncGenerator<FetchOptions, void, unknown>

export declare interface Transaction {
  type: 'transaction'
  id?: string
  mutations: Mutation[]
}

export declare function transaction(id: string, mutations: Mutation[]): Transaction

export declare function transaction(mutations: Mutation[]): Transaction

declare interface TransactionPayload {
  transactionId?: string
  mutations: Mutation_2[]
}

/**
 * Creates a `truncate` operation that will remove all items after `startIndex` until the end of the array or the provided `endIndex`.
 * @param startIndex - The start index for the truncate operation.
 * @param endIndex - The end index for the truncate operation.
 * @returns A `truncate` operation.
 * @remarks - This will be converted to an `unset` patch when submitted to the API
 * {@link https://www.sanity.io/docs/http-patches#xRtBjp8o}
 * @beta
 */
export declare function truncate(startIndex: number, endIndex?: number): TruncateOp

export declare type TruncateOp = {
  type: 'truncate'
  startIndex: number
  endIndex?: number
}

declare type Tuplify<T> = T extends readonly [infer NP, ...infer Rest]
  ? [NP, ...Rest]
  : T extends readonly (infer NP)[]
    ? NP[]
    : [T]

export declare type UnassignOp<K extends readonly string[] = readonly string[]> = {
  type: 'unassign'
  keys: K
}

/**
 * Creates an `unset` operation.
 * @returns An `unset` operation.
 * {@link https://www.sanity.io/docs/http-patches#xRtBjp8o}
 * @beta
 */
export declare const unset: () => UnsetOp

export declare type UnsetOp = {
  type: 'unset'
}

export declare type UpsertOp<
  Items extends AnyArray,
  Pos extends RelativePosition,
  ReferenceItem extends IndexedSegment | KeyedSegment,
> = {
  type: 'upsert'
  items: Items
  referenceItem: ReferenceItem
  position: Pos
}

export {}
