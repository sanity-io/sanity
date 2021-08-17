/* eslint-disable no-dupe-class-members, @typescript-eslint/no-misused-new */
import Observable from '@sanity/observable/minimal'

export type AssetMetadataType = 'location' | 'exif' | 'image' | 'palette' | 'lqip' | 'none'
export type DatasetAclMode = 'public' | 'private' | 'custom'
export type ListenVisibility = 'sync' | 'async' | 'query'
export type ListenEventName = 'mutation' | 'welcome' | 'reconnect'

export interface ResponseEvent<T = unknown> {
  type: 'response'
  body: T
  url: string
  method: string
  statusCode: number
  statusMessage?: string
  headers: Record<string, string>
}

export interface ProgressEvent {
  type: 'progress'
  stage: 'upload' | 'download'
  percent: number
  total?: number
  loaded?: number
  lengthComputable: boolean
}

type AttributeSet = {[key: string]: any}
type QueryParams = {[key: string]: any}
type MutationSelection = {query: string} | {id: string}
type SanityReference = {_ref: string}

interface RawRequestOptions {
  url?: string
  uri?: string
  method?: string
  token?: string
  json?: boolean
  tag?: string
  useGlobalApi?: boolean
  withCredentials?: boolean
  query?: {[key: string]: string | string[]}
  headers?: {[key: string]: string}
  timeout?: number
  proxy?: string
  body?: any
}

interface AuthProvider {
  name: string
  title: string
  url: string
}

interface SanityUser {
  id: string
  projectId: string
  displayName: string
  familyName: string | null
  givenName: string | null
  middleName: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  isCurrentUser: boolean
}

interface CurrentSanityUser {
  id: string
  name: string
  email: string
  profileImage: string | null
  role: string
}

interface SanityProjectMember {
  id: string
  role: string
  isRobot: boolean
  isCurrentUser: boolean
}

interface SanityProject {
  id: string
  displayName: string
  studioHost: string | null
  organizationId: string | null
  isBlocked: boolean
  isDisabled: boolean
  isDisabledByUser: boolean
  createdAt: string
  pendingInvites?: number
  maxRetentionDays?: number
  members: SanityProjectMember[]
  metadata: {
    color?: string
    externalStudioHost?: string
  }
}

type GetItRequester = {
  use: (middleware: any) => GetItRequester
}

export interface UploadOptions {
  /**
   * Optional request tag for the upload
   */
  tag?: string

  /**
   * Whether or not to preserve the original filename (default: true)
   */
  preserveFilename?: boolean

  /**
   * Filename for this file (optional)
   */
  filename?: string

  /**
   * Milliseconds to wait before timing the request out
   */
  timeout?: number

  /**
   * Mime type of the file
   */
  contentType?: string

  /**
   * Array of metadata parts to extract from asset
   */
  extract?: AssetMetadataType[]

  /**
   * Optional freeform label for the asset. Generally not used.
   */
  label?: string

  /**
   * Optional title for the asset
   */
  title?: string

  /**
   * Optional description for the asset
   */
  description?: string

  /**
   * The credit to person(s) and/or organization(s) required by the supplier of the asset to be used when published
   */
  creditLine?: string

  /**
   * Source data (when the asset is from an external service)
   */
  source?: {
    /**
     * The (u)id of the asset within the source, i.e. 'i-f323r1E'
     */
    id: string

    /**
     * The name of the source, i.e. 'unsplash'
     */
    name: string

    /**
     * A url to where to find the asset, or get more info about it in the source
     */
    url?: string
  }
}

export type InsertPatch =
  | {before: string; items: any[]}
  | {after: string; items: any[]}
  | {replace: string; items: any[]}

// Note: this is actually incorrect/invalid, but implemented as-is for backwards compatibility
export interface PatchOperations {
  set?: {[key: string]: any}
  setIfMissing?: {[key: string]: any}
  merge?: {[key: string]: any}
  diffMatchPatch?: {[key: string]: any}
  unset?: string[]
  inc?: {[key: string]: number}
  dec?: {[key: string]: number}
  insert?: InsertPatch
  ifRevisionID?: string
}

export type PatchBuilder = (patch: Patch) => Patch

export type PatchMutationOperation = PatchOperations & MutationSelection

export type Mutation<R = any> =
  | {create: SanityDocumentStub<R>}
  | {createOrReplace: IdentifiedSanityDocumentStub<R>}
  | {createIfNotExists: IdentifiedSanityDocumentStub<R>}
  | {delete: MutationSelection}
  | {patch: PatchMutationOperation}

export interface SingleMutationResult {
  transactionId: string
  documentId: string
  results: {id: string}[]
}

export interface MultipleMutationResult {
  transactionId: string
  documentIds: string[]
  results: {id: string}[]
}

export class Patch {
  constructor(documentId: string, operations?: PatchOperations, client?: SanityClient)

  /**
   * Clones the patch
   */
  clone(): Patch

  /**
   * DEPRECATED: Don't use.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @deprecated
   * @param attrs Attributes to merge
   */
  merge(attrs: AttributeSet): this

  /**
   * DEPRECATED: Don't use.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @deprecated
   * @param attrs Attributes to replace
   */
  replace(attrs: AttributeSet): this

  /**
   * Sets the given attributes to the document. Does NOT merge objects.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs Attributes to set. To set a deep attribute, use JSONMatch, eg: {"nested.prop": "value"}
   */
  set(attrs: AttributeSet): this

  /**
   * Sets the given attributes to the document if they are not currently set. Does NOT merge objects.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs Attributes to set. To set a deep attribute, use JSONMatch, eg: {"nested.prop": "value"}
   */
  setIfMissing(attrs: AttributeSet): this

  /**
   * Performs a "diff-match-patch" operation on the string attributes provided.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs Attributes to perform operation on. To set a deep attribute, use JSONMatch, eg: {"nested.prop": "dmp"}
   */
  diffMatchPatch(attrs: AttributeSet): this

  /**
   * Unsets the attribute paths provided.
   * The operation is added to the current patch, ready to be commited by `commit()`
   *
   * @param attrs Attribute paths to unset.
   */
  unset(attrs: string[]): this

  /**
   * Increment a numeric value. Each entry in the argument is either an attribute or a JSON path. The value may be a positive or negative integer or floating-point value. The operation will fail if target value is not a numeric value, or doesn't exist.
   *
   * @param attrs Object of attribute paths to increment, values representing the number to increment by.
   */
  inc(attrs: {[key: string]: number}): this

  /**
   * Decrement a numeric value. Each entry in the argument is either an attribute or a JSON path. The value may be a positive or negative integer or floating-point value. The operation will fail if target value is not a numeric value, or doesn't exist.
   *
   * @param attrs Object of attribute paths to decrement, values representing the number to decrement by.
   */
  dec(attrs: {[key: string]: number}): this

  /**
   * Provides methods for modifying arrays, by inserting, appending and replacing elements via a JSONPath expression.
   *
   * @param at Location to insert at, relative to the given selector, or 'replace' the matched path
   * @param selector JSONPath expression, eg `comments[-1]` or `blocks[_key=="abc123"]`
   * @param items Array of items to insert/replace
   */
  insert(at: 'before' | 'after' | 'replace', selector: string, items: any[]): this

  /**
   * Append the given items to the array at the given JSONPath
   *
   * @param selector Attribute/path to append to, eg `comments` or `person.hobbies`
   * @param items Array of items to append to the array
   */
  append(selector: string, items: any[]): this

  /**
   * Prepend the given items to the array at the given JSONPath
   *
   * @param selector Attribute/path to prepend to, eg `comments` or `person.hobbies`
   * @param items Array of items to prepend to the array
   */
  prepend(selector: string, items: any[]): this

  /**
   * Change the contents of an array by removing existing elements and/or adding new elements.
   *
   * @param selector Attribute or JSONPath expression for array
   * @param start Index at which to start changing the array (with origin 0). If greater than the length of the array, actual starting index will be set to the length of the array. If negative, will begin that many elements from the end of the array (with origin -1) and will be set to 0 if absolute value is greater than the length of the array.x
   * @param deleteCount An integer indicating the number of old array elements to remove.
   * @param items The elements to add to the array, beginning at the start index. If you don't specify any elements, splice() will only remove elements from the array.
   */
  splice(selector: string, start: number, deleteCount: number, items: any[]): this

  /**
   * Adds a revision clause, preventing the document from being patched if the `_rev` property does not match the given value
   *
   * @param rev Revision to lock the patch to
   */
  ifRevisionId(rev: string): this

  /**
   * Return a plain JSON representation of the patch
   */
  serialize(): PatchMutationOperation

  /**
   * Return a plain JSON representation of the patch
   */
  toJSON(): PatchMutationOperation

  /**
   * Commit the patch, returning a promise that resolves to the first patched document
   *
   * @param options Options for the mutation operation
   */
  commit<R = any>(options: FirstDocumentMutationOptions): Promise<SanityDocument<R>>

  /**
   * Commit the patch, returning a promise that resolves to an array of the mutated documents
   *
   * @param options Options for the mutation operation
   */
  commit<R = any>(options: AllDocumentsMutationOptions): Promise<SanityDocument<R>[]>

  /**
   * Commit the patch, returning a promise that resolves to a mutation result object
   *
   * @param options Options for the mutation operation
   */
  commit(options: FirstDocumentIdMutationOptions): Promise<SingleMutationResult>

  /**
   * Commit the patch, returning a promise that resolves to a mutation result object
   *
   * @param options Options for the mutation operation
   */
  commit(options: AllDocumentIdsMutationOptions): Promise<MultipleMutationResult>

  /**
   * Commit the patch, returning a promise that resolves to the first patched document
   *
   * @param options Options for the mutation operation
   */
  commit<R = any>(options?: BaseMutationOptions): Promise<SanityDocument<R>>

  /**
   * Clears the patch of all operations
   */
  reset(): this
}

export class Transaction {
  constructor(operations?: Mutation[], client?: SanityClient, transactionId?: string)
  clone(): Transaction

  /**
   * Creates a new Sanity document. If `_id` is provided and already exists, the mutation will fail. If no `_id` is given, one will automatically be generated by the database.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param doc Document to create. Requires a `_type` property.
   */
  create<R = any>(doc: SanityDocumentStub<R>): this

  /**
   * Creates a new Sanity document. If a document with the same `_id` already exists, the create operation will be ignored.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param doc Document to create if it does not already exist. Requires `_id` and `_type` properties.
   */
  createIfNotExists<R = any>(doc: IdentifiedSanityDocumentStub<R>): this

  /**
   * Creates a new Sanity document, or replaces an existing one if the same `_id` is already used.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param doc Document to create or replace. Requires `_id` and `_type` properties.
   */
  createOrReplace<R = any>(doc: IdentifiedSanityDocumentStub<R>): this

  /**
   * Deletes the document with the given document ID
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param documentId Document ID to delete
   */
  delete(documentId: string): this

  /**
   * Performs a patch on the given document ID. Can either be a builder function or an object of patch operations.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param documentId Document ID to perform the patch operation on
   * @param patchOps Operations to perform, or a builder function
   */
  patch(documentId: string, patchOps?: PatchBuilder | PatchOperations): this

  /**
   * Adds the given patch instance to the transaction.
   * The operation is added to the current transaction, ready to be commited by `commit()`
   *
   * @param patch Patch to execute
   */
  patch(patch: Patch): this

  /**
   * Set or gets the ID of this transaction.
   * Should generally not be specified.
   * If no ID is specified, the currently configured ID will be returned, if any.
   *
   * @param id Transaction ID
   */
  transactionId<T extends string | undefined>(id: T): T extends string ? this : string | undefined

  /**
   * Return a plain JSON representation of the transaction
   */
  serialize(): Mutation[]

  /**
   * Return a plain JSON representation of the transaction
   */
  toJSON(): Mutation[]

  /**
   * Commit the transaction, returning a promise that resolves to the first mutated document
   *
   * @param options Options for the mutation operation
   */
  commit<R>(options: TransactionFirstDocumentMutationOptions): Promise<SanityDocument<R>>

  /**
   * Commit the transaction, returning a promise that resolves to an array of the mutated documents
   *
   * @param options Options for the mutation operation
   */
  commit<R>(options: TransactionAllDocumentsMutationOptions): Promise<SanityDocument<R>[]>

  /**
   * Commit the transaction, returning a promise that resolves to a mutation result object
   *
   * @param options Options for the mutation operation
   */
  commit(options: TransactionFirstDocumentIdMutationOptions): Promise<SingleMutationResult>

  /**
   * Commit the transaction, returning a promise that resolves to a mutation result object
   *
   * @param options Options for the mutation operation
   */
  commit(options: TransactionAllDocumentIdsMutationOptions): Promise<MultipleMutationResult>

  /**
   * Commit the transaction, returning a promise that resolves to a mutation result object
   *
   * @param options Options for the mutation operation
   */
  commit(options?: BaseMutationOptions): Promise<MultipleMutationResult>

  /**
   * Clears the transaction of all operations
   */
  reset(): this
}

export interface ClientConfig {
  projectId?: string
  dataset?: string
  useCdn?: boolean
  token?: string
  apiHost?: string
  apiVersion?: string
  proxy?: string
  requestTagPrefix?: string
  ignoreBrowserTokenWarning?: boolean
  withCredentials?: boolean

  /**
   * @deprecated Don't use
   */
  gradientMode?: boolean

  /**
   * @deprecated Don't use
   */
  namespace?: string

  /**
   * @deprecated Don't use
   */
  useProjectHostname?: boolean

  /**
   * @deprecated Don't use
   */
  requester?: GetItRequester
}

/**
 * @deprecated Don't use
 */
export type ProjectlessClientConfig = ClientConfig & {useProjectHostname: false}

/**
 * @deprecated Don't use
 */
export type ProjectClientConfig = ClientConfig & {
  useProjectHostname?: true
  projectId: string
}

export interface RequestOptions {
  timeout?: number
  token?: string
  tag?: string
}

type BaseMutationOptions = RequestOptions & {
  visibility?: 'sync' | 'async' | 'defer'
  returnDocuments?: boolean
  returnFirst?: boolean
}

export type MutationEvent<R = any> = {
  type: 'mutation'
  documentId: string
  eventId: string
  identity: string
  mutations: Mutation[]
  previousRev?: string
  resultRev?: string
  result?: SanityDocument<R>
  previous?: SanityDocument<R> | null
  effects?: {apply: unknown[]; revert: unknown[]}
  timestamp: string
  transactionId: string
  transition: 'update' | 'appear' | 'disappear'
  visibility: 'query' | 'transaction'
}

export type ChannelErrorEvent = {
  type: 'channelError'
  message: string
}

export type DisconnectEvent = {
  type: 'disconnect'
  reason: string
}

export type ReconnectEvent = {
  type: 'reconnect'
}

export type WelcomeEvent = {
  type: 'welcome'
}

export type ListenEvent<R> =
  | MutationEvent<R>
  | ChannelErrorEvent
  | DisconnectEvent
  | ReconnectEvent
  | WelcomeEvent

export interface ListenOptions {
  includeResult?: boolean
  includePreviousRevision?: boolean
  visibility?: 'sync' | 'async' | 'query'
  events?: ListenEventName[]
  effectFormat?: 'mendoza'
  tag?: string
}

export type PreviousNextListenOptions = ListenOptions & {
  includeResult: true
  includePreviousRevision: true
}

export type PreviousListenOptions = ListenOptions & {
  includePreviousRevision: true
  includeResult: false
}

export type NextListenOptions = ListenOptions & {
  includePreviousRevision: false
  includeResult: true
}

export type ResultlessListenOptions = ListenOptions & {
  includeResult: false
  includePreviousRevision: false
}

export type FilteredResponseQueryOptions = RequestOptions & {
  filterResponse?: true
}

export type UnfilteredResponseQueryOptions = RequestOptions & {
  filterResponse: false
}

export type QueryOptions = FilteredResponseQueryOptions | UnfilteredResponseQueryOptions

type FirstDocumentMutationOptions = BaseMutationOptions & {
  returnFirst?: true
  returnDocuments?: true
}

type FirstDocumentIdMutationOptions = BaseMutationOptions & {
  returnFirst?: true
  returnDocuments: false
}

type AllDocumentsMutationOptions = BaseMutationOptions & {
  returnFirst: false
  returnDocuments?: true
}

type AllDocumentIdsMutationOptions = BaseMutationOptions & {
  returnFirst: false
  returnDocuments: false
}

export type MutationOptions =
  | FirstDocumentMutationOptions
  | FirstDocumentIdMutationOptions
  | AllDocumentsMutationOptions
  | AllDocumentIdsMutationOptions

type TransactionFirstDocumentMutationOptions = BaseMutationOptions & {
  returnFirst: true
  returnDocuments: true
}

type TransactionFirstDocumentIdMutationOptions = BaseMutationOptions & {
  returnFirst: true
  returnDocuments?: false
}

type TransactionAllDocumentsMutationOptions = BaseMutationOptions & {
  returnFirst?: false
  returnDocuments: true
}

type TransactionAllDocumentIdsMutationOptions = BaseMutationOptions & {
  returnFirst?: false
  returnDocuments?: false
}

export type TransactionMutationOptions =
  | TransactionFirstDocumentMutationOptions
  | TransactionFirstDocumentIdMutationOptions
  | TransactionAllDocumentsMutationOptions
  | TransactionAllDocumentIdsMutationOptions

export interface RawQueryResponse<R> {
  q: string
  ms: number
  result: R
}

export type SanityDocument<T extends Record<string, any> = Record<string, any>> = {
  [P in keyof T]: T[P]
} & {
  _id: string
  _rev: string
  _type: string
  _createdAt: string
  _updatedAt: string
}

export type SanityDocumentStub<T extends Record<string, any> = Record<string, any>> = {
  [P in keyof T]: T[P]
} & {
  _type: string
}

export type IdentifiedSanityDocumentStub<T extends Record<string, any> = Record<string, any>> = {
  [P in keyof T]: T[P]
} & {
  _id: string
} & SanityDocumentStub

export interface SanityAssetDocument extends SanityDocument {
  url: string
  path: string
  size: number
  assetId: string
  mimeType: string
  sha1hash: string
  extension: string
  uploadId?: string
  originalFilename?: string
}

export interface SanityImagePalette {
  background: string
  foreground: string
  population: number
  title: string
}

export interface SanityImageAssetDocument extends SanityAssetDocument {
  metadata: {
    _type: 'sanity.imageMetadata'
    hasAlpha: boolean
    isOpaque: boolean
    lqip?: string
    dimensions: {
      _type: 'sanity.imageDimensions'
      aspectRatio: number
      height: number
      width: number
    }
    palette?: {
      _type: 'sanity.imagePalette'
      darkMuted?: SanityImagePalette
      darkVibrant?: SanityImagePalette
      dominant?: SanityImagePalette
      lightMuted?: SanityImagePalette
      lightVibrant?: SanityImagePalette
      muted?: SanityImagePalette
      vibrant?: SanityImagePalette
    }
    image?: {
      _type: 'sanity.imageExifTags'
      [key: string]: any
    }
    exif?: {
      _type: 'sanity.imageExifMetadata'
      [key: string]: any
    }
  }
}

export class ClientError extends Error {
  response: any
  statusCode: number
  responseBody?: any
  details?: any
}

export class ServerError extends Error {
  response: any
  statusCode: number
  responseBody?: any
  details?: any
}

export class ObservableSanityClient {
  static Patch: typeof Patch
  static Transaction: typeof Transaction
  static ClientError: typeof ClientError
  static ServerError: typeof ServerError
  static requester: GetItRequester

  // Client/configuration
  constructor(config: ClientConfig)

  /**
   * Clone the client - returns a new instance
   */
  clone(): ObservableSanityClient

  /**
   * Returns the current client configuration
   */
  config(): ClientConfig

  /**
   * Reconfigure the client. Note that this _mutates_ the current client.
   *
   * @param newConfig New client configuration properties
   */
  config(newConfig?: Partial<ClientConfig>): this

  /**
   * Clone the client with a new (partial) configuration.
   *
   * @param newConfig New client configuration properties, shallowly merged with existing configuration
   */
  withConfig(newConfig?: Partial<ClientConfig>): ObservableSanityClient

  /**
   * @deprecated Use `client.config()` instead
   */
  clientConfig: ClientConfig

  assets: {
    /**
     * Uploads a file asset to the configured dataset
     *
     * @param assetType Asset type (file/image)
     * @param body Asset content - can be a browser File instance, a Blob, a Node.js Buffer instance or a Node.js ReadableStream.
     * @param options Options to use for the upload
     */
    upload(
      assetType: 'file' | 'image',
      body: File | Blob | Buffer | ReadableStream,
      options?: UploadOptions
    ): Observable<
      ResponseEvent<{document: SanityAssetDocument | SanityImageAssetDocument}> | ProgressEvent
    >

    /**
     * Uploads a file asset to the configured dataset
     *
     * @param assetType Asset type (file/image)
     * @param body Asset content - can be a browser File instance, a Blob, a Node.js Buffer instance or a Node.js ReadableStream.
     * @param options Options to use for the upload
     */
    upload(
      assetType: 'file',
      body: File | Blob | Buffer | ReadableStream,
      options?: UploadOptions
    ): Observable<ResponseEvent<{document: SanityAssetDocument}> | ProgressEvent>

    /**
     * Uploads an image asset to the configured dataset
     *
     * @param assetType Asset type (file/image)
     * @param body Asset content - can be a browser File instance, a Blob, a Node.js Buffer instance or a Node.js ReadableStream.
     * @param options Options to use for the upload
     */
    upload(
      assetType: 'image',
      body: File | Blob | Buffer | ReadableStream,
      options?: UploadOptions
    ): Observable<ResponseEvent<{document: SanityImageAssetDocument}> | ProgressEvent>

    /**
     * DEPRECATED: Deletes an asset of the given type and ID
     *
     * @deprecated Use `client.delete(assetDocumentId)` instead
     * @param assetType Asset type (file/image)
     * @param id Document ID or asset document to delete
     */
    delete(
      assetType: 'file' | 'image',
      id: string | IdentifiedSanityDocumentStub
    ): Observable<SanityAssetDocument | undefined>

    /**
     * DEPRECATED: Returns the URL for an asset with a given document ID
     *
     * @deprecated Use the `@sanity/image-url` module instead
     * @param id Document ID or asset reference to get URL for
     * @param query Optional object of query string parameters to append
     */
    getImageUrl(id: string | SanityReference, query: {[key: string]: string | number}): string
  }

  datasets: {
    /**
     * Create a new dataset with the given name
     *
     * @param name Name of the dataset to create
     * @param options Options for the dataset
     */
    create(
      name: string,
      options?: {aclMode?: DatasetAclMode}
    ): Observable<{datasetName: string; aclMode: DatasetAclMode}>

    /**
     * Edit a dataset with the given name
     *
     * @param name Name of the dataset to edit
     * @param options New options for the dataset
     */
    edit(
      name: string,
      options: {aclMode?: DatasetAclMode}
    ): Observable<{datasetName: string; aclMode: DatasetAclMode}>

    /**
     * Delete a dataset with the given name
     *
     * @param name Name of the dataset to delete
     */
    delete(name: string): Observable<{deleted: true}>

    /**
     * Fetch a list of datasets for the configured project
     */
    list(): Observable<{name: string; aclMode: DatasetAclMode}[]>
  }

  projects: {
    /**
     * Fetch a list of projects the authenticated user has access to
     */
    list(): Observable<SanityProject[]>

    /**
     * Fetch a project by project ID
     *
     * @param projectId ID of the project to fetch
     */
    getById(projectId: string): Observable<SanityProject>
  }

  users: {
    /**
     * Fetch a user by user ID
     *
     * @param id User ID of the user to fetch. If `me` is provided, a minimal response including the users role is returned.
     */
    getById<T extends 'me' | string>(
      id: T
    ): T extends 'me' ? Observable<CurrentSanityUser> : Observable<SanityUser>
  }

  auth: {
    /**
     * Fetch available login providers
     */
    getLoginProviders(): Observable<{providers: AuthProvider[]}>

    /**
     * Revoke the configured session/token
     */
    logout(): Observable<any>
  }

  /**
   * Set up a listener that will be notified when mutations occur on documents matching the provided query/filter.
   *
   * @param query GROQ-filter to listen to changes for
   * @param params Optional query parameters
   * @param options Listener options
   */
  listen(query: string, params?: QueryParams): Observable<MutationEvent>

  /**
   * Set up a listener that will be notified when mutations occur on documents matching the provided query/filter.
   *
   * @param query GROQ-filter to listen to changes for
   * @param params Optional query parameters
   * @param options Listener options
   */
  listen(query: string, params?: QueryParams, options?: ListenOptions): Observable<ListenEvent<any>>

  /**
   * Perform a GROQ-query against the configured dataset.
   *
   * @param query GROQ-query to perform
   */
  fetch<R = any>(query: string): Observable<R>

  /**
   * Perform a GROQ-query against the configured dataset.
   *
   * @param query GROQ-query to perform
   * @param params Query parameters
   */
  fetch<R = any>(query: string, params: QueryParams): Observable<R>

  /**
   * Perform a GROQ-query against the configured dataset.
   *
   * @param query GROQ-query to perform
   * @param params Query parameters
   * @param options Request options
   */
  fetch<R = any>(
    query: string,
    params: QueryParams | undefined,
    options: FilteredResponseQueryOptions
  ): Observable<R>

  /**
   * Perform a GROQ-query against the configured dataset.
   *
   * @param query GROQ-query to perform
   * @param params Query parameters
   * @param options Request options
   */
  fetch<R = any>(
    query: string,
    params: QueryParams | undefined,
    options: UnfilteredResponseQueryOptions
  ): Observable<RawQueryResponse<R>>

  /**
   * Fetch a single document with the given ID.
   *
   * @param id Document ID to fetch
   * @param options Request options
   */
  getDocument<R = any>(
    id: string,
    options?: {tag?: string}
  ): Observable<SanityDocument<R> | undefined>

  /**
   * Fetch multiple documents in one request.
   * Should be used sparingly - performing a query is usually a better option.
   * The order/position of documents is preserved based on the original array of IDs.
   * If a any of the documents are missing, they will be replaced by a `null` entry in the returned array
   *
   * @param ids Document IDs to fetch
   * @param options Request options
   */
  getDocuments<R = any>(
    ids: string[],
    options?: {tag?: string}
  ): Observable<(SanityDocument<R> | null)[]>

  /**
   * Create a document. Requires a `_type` property. If no `_id` is provided, it will be generated by the database.
   * Returns an observable that resolves to the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  create<R = any>(
    document: SanityDocumentStub<R>,
    options: FirstDocumentMutationOptions
  ): Observable<SanityDocument<R>>

  /**
   * Create a document. Requires a `_type` property. If no `_id` is provided, it will be generated by the database.
   * Returns an observable that resolves to an array containing the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  create<R = any>(
    document: SanityDocumentStub<R>,
    options: AllDocumentsMutationOptions
  ): Observable<SanityDocument<R>[]>

  /**
   * Create a document. Requires a `_type` property. If no `_id` is provided, it will be generated by the database.
   * Returns an observable that resolves to a mutation result object containing the ID of the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  create<R = any>(
    document: SanityDocumentStub<R>,
    options: FirstDocumentIdMutationOptions
  ): Observable<SingleMutationResult>

  /**
   * Create a document. Requires a `_type` property. If no `_id` is provided, it will be generated by the database.
   * Returns an observable that resolves to a mutation result object containing the ID of the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  create<R = any>(
    document: SanityDocumentStub<R>,
    options: AllDocumentIdsMutationOptions
  ): Observable<MultipleMutationResult>

  /**
   * Create a document. Requires a `_type` property. If no `_id` is provided, it will be generated by the database.
   * Returns an observable that resolves to the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  create<R = any>(
    document: SanityDocumentStub<R>,
    options?: BaseMutationOptions
  ): Observable<SanityDocument<R>>

  /**
   * Create a document if no document with the same ID already exists.
   * Returns an observable that resolves to the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  createIfNotExists<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: FirstDocumentMutationOptions
  ): Observable<SanityDocument<R>>

  /**
   * Create a document if no document with the same ID already exists.
   * Returns an observable that resolves to an array containing the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  createIfNotExists<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: AllDocumentsMutationOptions
  ): Observable<SanityDocument<R>[]>

  /**
   * Create a document if no document with the same ID already exists.
   * Returns an observable that resolves to a mutation result object containing the ID of the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  createIfNotExists<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: FirstDocumentIdMutationOptions
  ): Observable<SingleMutationResult>

  /**
   * Create a document if no document with the same ID already exists.
   * Returns an observable that resolves to a mutation result object containing the ID of the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  createIfNotExists<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: AllDocumentIdsMutationOptions
  ): Observable<MultipleMutationResult>

  /**
   * Create a document if no document with the same ID already exists.
   * Returns an observable that resolves to the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  createIfNotExists<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options?: BaseMutationOptions
  ): Observable<SanityDocument<R>>

  /**
   * Create a document if it does not exist, or replace a document with the same document ID
   * Returns an observable that resolves to the created document.
   *
   * @param document Document to either create or replace
   * @param options Mutation options
   */
  createOrReplace<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: FirstDocumentMutationOptions
  ): Observable<SanityDocument<R>>

  /**
   * Create a document if it does not exist, or replace a document with the same document ID
   * Returns an observable that resolves to an array containing the created document.
   *
   * @param document Document to either create or replace
   * @param options Mutation options
   */
  createOrReplace<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: AllDocumentsMutationOptions
  ): Observable<SanityDocument<R>[]>

  /**
   * Create a document if it does not exist, or replace a document with the same document ID
   * Returns an observable that resolves to a mutation result object containing the ID of the created document.
   *
   * @param document Document to either create or replace
   * @param options Mutation options
   */
  createOrReplace<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: FirstDocumentIdMutationOptions
  ): Observable<SingleMutationResult>

  /**
   * Create a document if it does not exist, or replace a document with the same document ID
   * Returns an observable that resolves to a mutation result object containing the created document ID.
   *
   * @param document Document to either create or replace
   * @param options Mutation options
   */
  createOrReplace<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: AllDocumentIdsMutationOptions
  ): Observable<MultipleMutationResult>

  /**
   * Create a document if it does not exist, or replace a document with the same document ID
   * Returns an observable that resolves to the created document.
   *
   * @param document Document to either create or replace
   * @param options Mutation options
   */
  createOrReplace<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options?: BaseMutationOptions
  ): Observable<SanityDocument<R>>

  /**
   * Deletes a document with the given document ID.
   * Returns an observable that resolves to the deleted document.
   *
   * @param id Document ID to delete
   * @param options Options for the mutation
   */
  delete<R = any>(id: string, options: FirstDocumentMutationOptions): Observable<SanityDocument<R>>

  /**
   * Deletes a document with the given document ID.
   * Returns an observable that resolves to an array containing the deleted document.
   *
   * @param id Document ID to delete
   * @param options Options for the mutation
   */
  delete<R = any>(id: string, options: AllDocumentsMutationOptions): Observable<SanityDocument<R>[]>

  /**
   * Deletes a document with the given document ID.
   * Returns an observable that resolves to a mutation result object containing the deleted document ID.
   *
   * @param id Document ID to delete
   * @param options Options for the mutation
   */
  delete(id: string, options: FirstDocumentIdMutationOptions): Observable<SingleMutationResult>

  /**
   * Deletes a document with the given document ID.
   * Returns an observable that resolves to a mutation result object containing the deleted document ID.
   *
   * @param id Document ID to delete
   * @param options Options for the mutation
   */
  delete(id: string, options: AllDocumentIdsMutationOptions): Observable<MultipleMutationResult>

  /**
   * Deletes a document with the given document ID.
   * Returns an observable that resolves to the deleted document.
   *
   * @param id Document ID to delete
   * @param options Options for the mutation
   */
  delete<R = any>(id: string, options?: BaseMutationOptions): Observable<SanityDocument<R>>

  /**
   * Deletes one or more documents matching the given query or document ID.
   * Returns an observable that resolves to first deleted document.
   *
   * @param selection An object with either an `id` or `query` key defining what to delete
   * @param options Options for the mutation
   */
  delete<R = any>(
    selection: MutationSelection,
    options: FirstDocumentMutationOptions
  ): Observable<SanityDocument<R>>

  /**
   * Deletes one or more documents matching the given query or document ID.
   * Returns an observable that resolves to an array containing the deleted documents.
   *
   * @param selection An object with either an `id` or `query` key defining what to delete
   * @param options Options for the mutation
   */
  delete<R = any>(
    selection: MutationSelection,
    options: AllDocumentsMutationOptions
  ): Observable<SanityDocument<R>[]>

  /**
   * Deletes one or more documents matching the given query or document ID.
   * Returns an observable that resolves to a mutation result object containing the ID of the first deleted document.
   *
   * @param selection An object with either an `id` or `query` key defining what to delete
   * @param options Options for the mutation
   */
  delete(
    selection: MutationSelection,
    options: FirstDocumentIdMutationOptions
  ): Observable<SingleMutationResult>

  /**
   * Deletes one or more documents matching the given query or document ID.
   * Returns an observable that resolves to a mutation result object containing the document IDs that were deleted.
   *
   * @param selection An object with either an `id` or `query` key defining what to delete
   * @param options Options for the mutation
   */
  delete(
    selection: MutationSelection,
    options: AllDocumentIdsMutationOptions
  ): Observable<MultipleMutationResult>

  /**
   * Deletes one or more documents matching the given query or document ID.
   * Returns an observable that resolves to first deleted document.
   *
   * @param selection An object with either an `id` or `query` key defining what to delete
   * @param options Options for the mutation
   */
  delete<R = any>(
    selection: MutationSelection,
    options?: BaseMutationOptions
  ): Observable<SanityDocument<R>>

  /**
   * Perform mutation operations against the configured dataset
   * Returns an observable that resolves to the first mutated document.
   *
   * @param operations Mutation operations to execute
   * @param options Mutation options
   */
  mutate<R = any>(
    operations: Mutation<R>[] | Patch | Transaction,
    options: FirstDocumentMutationOptions
  ): Observable<SanityDocument<R>>

  /**
   * Perform mutation operations against the configured dataset.
   * Returns an observable that resolves to an array of the mutated documents.
   *
   * @param operations Mutation operations to execute
   * @param options Mutation options
   */
  mutate<R = any>(
    operations: Mutation<R>[] | Patch | Transaction,
    options: AllDocumentsMutationOptions
  ): Observable<SanityDocument<R>[]>

  /**
   * Perform mutation operations against the configured dataset
   * Returns an observable that resolves to a mutation result object containing the document ID of the first mutated document.
   *
   * @param operations Mutation operations to execute
   * @param options Mutation options
   */
  mutate<R = any>(
    operations: Mutation<R>[] | Patch | Transaction,
    options: FirstDocumentIdMutationOptions
  ): Observable<SingleMutationResult>

  /**
   * Perform mutation operations against the configured dataset
   * Returns an observable that resolves to a mutation result object containing the mutated document IDs.
   *
   * @param operations Mutation operations to execute
   * @param options Mutation options
   */
  mutate<R = any>(
    operations: Mutation<R>[] | Patch | Transaction,
    options: AllDocumentIdsMutationOptions
  ): Observable<MultipleMutationResult>

  /**
   * Perform mutation operations against the configured dataset
   * Returns an observable that resolves to the first mutated document.
   *
   * @param operations Mutation operations to execute
   * @param options Mutation options
   */
  mutate<R = any>(
    operations: Mutation<R>[] | Patch | Transaction,
    options?: BaseMutationOptions
  ): Observable<SanityDocument<R>>

  /**
   * Create a new buildable patch of operations to perform
   *
   * @param documentId Document ID to patch
   * @param operations Optional object of patch operations to initialize the patch instance with
   */
  patch(documentId: string | MutationSelection, operations?: PatchOperations): Patch

  /**
   * Create a new transaction of mutations
   *
   * @param operations Optional array of mutation operations to initialize the transaction instance with
   */
  transaction<R = any>(operations?: Mutation<R>[]): Transaction

  // "Internals", should generally not be used externally
  /**
   * DEPRECATED: Returns whether or not this client is using the Observable API (otherwise it is using observables)
   *
   * @deprecated Should be an internal concern
   */
  isObservableAPI(): boolean

  /**
   * DEPRECATED: Get a Sanity API URL for the URI provided
   *
   * @deprecated Should be an internal concern
   * @param uri URI/path to build URL for
   * @param canUseCdn Whether or not to allow using the API CDN for this route
   */
  getUrl(uri: string, canUseCdn?: boolean): string

  /**
   * DEPRECATED: Get a Sanity API URL for the data operation and path provided
   *
   * @deprecated Should be an internal concern
   * @param operation Data operation
   * @param path Path to append
   */
  getDataUrl(operation: string, path?: string): string

  /**
   * DEPRECATED: Perform an HTTP request against the Sanity API
   *
   * @deprecated Use your own request library!
   * @param options Request options
   */
  request<T = any>(options: RawRequestOptions): Observable<ResponseEvent<T> | ProgressEvent>
}

export interface SanityClient {
  // Client/configuration
  constructor(config: ClientConfig): SanityClient

  /**
   * Clone the client - returns a new instance
   */
  clone(): SanityClient

  /**
   * Returns the current client configuration
   */
  config(): ClientConfig

  /**
   * Reconfigure the client. Note that this _mutates_ the current client.
   *
   * @param newConfig New client configuration properties
   */
  config(newConfig?: Partial<ClientConfig>): this

  /**
   * Clone the client with a new (partial) configuration.
   *
   * @param newConfig New client configuration properties, shallowly merged with existing configuration
   */
  withConfig(newConfig?: Partial<ClientConfig>): SanityClient

  /**
   * @deprecated Use `client.config()` instead
   */
  clientConfig: ClientConfig

  /**
   * Observable version of the Sanity client, with the same configuration as the promise-based one
   */
  observable: ObservableSanityClient

  assets: {
    /**
     * Uploads a file asset to the configured dataset
     *
     * @param assetType Asset type (file/image)
     * @param body Asset content - can be a browser File instance, a Blob, a Node.js Buffer instance or a Node.js ReadableStream.
     * @param options Options to use for the upload
     */
    upload(
      assetType: 'file' | 'image',
      body: File | Blob | Buffer | ReadableStream,
      options?: UploadOptions
    ): Promise<SanityAssetDocument | SanityImageAssetDocument>

    /**
     * Uploads a file asset to the configured dataset
     *
     * @param assetType Asset type (file/image)
     * @param body Asset content - can be a browser File instance, a Blob, a Node.js Buffer instance or a Node.js ReadableStream.
     * @param options Options to use for the upload
     */
    upload(
      assetType: 'file',
      body: File | Blob | Buffer | ReadableStream,
      options?: UploadOptions
    ): Promise<SanityAssetDocument>

    /**
     * Uploads an image asset to the configured dataset
     *
     * @param assetType Asset type (file/image)
     * @param body Asset content - can be a browser File instance, a Blob, a Node.js Buffer instance or a Node.js ReadableStream.
     * @param options Options to use for the upload
     */
    upload(
      assetType: 'image',
      body: File | Blob | Buffer | ReadableStream,
      options?: UploadOptions
    ): Promise<SanityImageAssetDocument>

    /**
     * DEPRECATED: Deletes an asset of the given type and ID
     *
     * @deprecated Use `client.delete(assetDocumentId)` instead
     * @param assetType Asset type (file/image)
     * @param id Document ID or asset document to delete
     */
    delete(
      assetType: 'file' | 'image',
      id: string | IdentifiedSanityDocumentStub
    ): Promise<SanityAssetDocument | undefined>

    /**
     * DEPRECATED: Returns the URL for an asset with a given document ID
     *
     * @deprecated Use the `@sanity/image-url` module instead
     * @param id Document ID or asset reference to get URL for
     * @param query Optional object of query string parameters to append
     */
    getImageUrl(id: string | SanityReference, query: {[key: string]: string | number}): string
  }

  datasets: {
    /**
     * Create a new dataset with the given name
     *
     * @param name Name of the dataset to create
     * @param options Options for the dataset
     */
    create(
      name: string,
      options?: {aclMode?: DatasetAclMode}
    ): Promise<{datasetName: string; aclMode: DatasetAclMode}>

    /**
     * Edit a dataset with the given name
     *
     * @param name Name of the dataset to edit
     * @param options New options for the dataset
     */
    edit(
      name: string,
      options: {aclMode?: DatasetAclMode}
    ): Promise<{datasetName: string; aclMode: DatasetAclMode}>

    /**
     * Delete a dataset with the given name
     *
     * @param name Name of the dataset to delete
     */
    delete(name: string): Promise<{deleted: true}>

    /**
     * Fetch a list of datasets for the configured project
     */
    list(): Promise<{name: string; aclMode: DatasetAclMode}[]>
  }

  projects: {
    /**
     * Fetch a list of projects the authenticated user has access to
     */
    list(): Promise<SanityProject[]>

    /**
     * Fetch a project by project ID
     *
     * @param projectId ID of the project to fetch
     */
    getById(projectId: string): Promise<SanityProject>
  }

  users: {
    /**
     * Fetch a user by user ID
     *
     * @param id User ID of the user to fetch. If `me` is provided, a minimal response including the users role is returned.
     */
    getById<T extends 'me' | string>(
      id: T
    ): T extends 'me' ? Promise<CurrentSanityUser> : Promise<SanityUser>
  }

  auth: {
    /**
     * Fetch available login providers
     */
    getLoginProviders(): Promise<{providers: AuthProvider[]}>

    /**
     * Revoke the configured session/token
     */
    logout(): Promise<any>
  }

  /**
   * Set up a listener that will be notified when mutations occur on documents matching the provided query/filter.
   *
   * @param query GROQ-filter to listen to changes for
   * @param params Optional query parameters
   * @param options Listener options
   */
  listen<R = any>(query: string, params?: QueryParams): Observable<MutationEvent<R>>

  /**
   * Set up a listener that will be notified when mutations occur on documents matching the provided query/filter.
   *
   * @param query GROQ-filter to listen to changes for
   * @param params Optional query parameters
   * @param options Listener options
   */
  listen<R = any>(
    query: string,
    params?: QueryParams,
    options?: ListenOptions
  ): Observable<ListenEvent<R>>

  /**
   * Perform a GROQ-query against the configured dataset.
   *
   * @param query GROQ-query to perform
   */
  fetch<R = any>(query: string): Promise<R>

  /**
   * Perform a GROQ-query against the configured dataset.
   *
   * @param query GROQ-query to perform
   * @param params Optional query parameters
   */
  fetch<R = any>(query: string, params: QueryParams): Promise<R>

  /**
   * Perform a GROQ-query against the configured dataset.
   *
   * @param query GROQ-query to perform
   * @param params Optional query parameters
   * @param options Request options
   */
  fetch<R = any>(
    query: string,
    params: QueryParams | undefined,
    options: FilteredResponseQueryOptions
  ): Promise<R>

  /**
   * Perform a GROQ-query against the configured dataset.
   *
   * @param query GROQ-query to perform
   * @param params Optional query parameters
   * @param options Request options
   */
  fetch<R = any>(
    query: string,
    params: QueryParams | undefined,
    options: UnfilteredResponseQueryOptions
  ): Promise<RawQueryResponse<R>>

  /**
   * Fetch a single document with the given ID.
   *
   * @param id Document ID to fetch
   * @param options Request options
   */
  getDocument<R = any>(id: string, options?: {tag?: string}): Promise<SanityDocument<R> | undefined>

  /**
   * Fetch multiple documents in one request.
   * Should be used sparingly - performing a query is usually a better option.
   * The order/position of documents is preserved based on the original array of IDs.
   * If a any of the documents are missing, they will be replaced by a `null` entry in the returned array
   *
   * @param ids Document IDs to fetch
   * @param options Request options
   */
  getDocuments<R = any>(
    ids: string[],
    options?: {tag?: string}
  ): Promise<(SanityDocument<R> | null)[]>

  /**
   * Create a document. Requires a `_type` property. If no `_id` is provided, it will be generated by the database.
   * Returns a promise that resolves to the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  create<R = any>(
    document: SanityDocumentStub<R>,
    options: FirstDocumentMutationOptions
  ): Promise<SanityDocument<R>>

  /**
   * Create a document. Requires a `_type` property. If no `_id` is provided, it will be generated by the database.
   * Returns a promise that resolves to an array containing the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  create<R = any>(
    document: SanityDocumentStub<R>,
    options: AllDocumentsMutationOptions
  ): Promise<SanityDocument<R>[]>

  /**
   * Create a document. Requires a `_type` property. If no `_id` is provided, it will be generated by the database.
   * Returns a promise that resolves to a mutation result object containing the ID of the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  create<R = any>(
    document: SanityDocumentStub<R>,
    options: FirstDocumentIdMutationOptions
  ): Promise<SingleMutationResult>

  /**
   * Create a document. Requires a `_type` property. If no `_id` is provided, it will be generated by the database.
   * Returns a promise that resolves to a mutation result object containing the ID of the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  create<R = any>(
    document: SanityDocumentStub<R>,
    options: AllDocumentIdsMutationOptions
  ): Promise<MultipleMutationResult>

  /**
   * Create a document. Requires a `_type` property. If no `_id` is provided, it will be generated by the database.
   * Returns a promise that resolves to the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  create<R = any>(
    document: SanityDocumentStub<R>,
    options?: BaseMutationOptions
  ): Promise<SanityDocument<R>>

  /**
   * Create a document if no document with the same ID already exists.
   * Returns a promise that resolves to the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  createIfNotExists<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: FirstDocumentMutationOptions
  ): Promise<SanityDocument<R>>

  /**
   * Create a document if no document with the same ID already exists.
   * Returns a promise that resolves to an array containing the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  createIfNotExists<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: AllDocumentsMutationOptions
  ): Promise<SanityDocument<R>[]>

  /**
   * Create a document if no document with the same ID already exists.
   * Returns a promise that resolves to a mutation result object containing the ID of the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  createIfNotExists<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: FirstDocumentIdMutationOptions
  ): Promise<SingleMutationResult>

  /**
   * Create a document if no document with the same ID already exists.
   * Returns a promise that resolves to a mutation result object containing the ID of the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  createIfNotExists<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: AllDocumentIdsMutationOptions
  ): Promise<MultipleMutationResult>

  /**
   * Create a document if no document with the same ID already exists.
   * Returns a promise that resolves to the created document.
   *
   * @param document Document to create
   * @param options Mutation options
   */
  createIfNotExists<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options?: BaseMutationOptions
  ): Promise<SanityDocument<R>>

  /**
   * Create a document if it does not exist, or replace a document with the same document ID
   * Returns a promise that resolves to the created document.
   *
   * @param document Document to either create or replace
   * @param options Mutation options
   */
  createOrReplace<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: FirstDocumentMutationOptions
  ): Promise<SanityDocument<R>>

  /**
   * Create a document if it does not exist, or replace a document with the same document ID
   * Returns a promise that resolves to an array containing the created document.
   *
   * @param document Document to either create or replace
   * @param options Mutation options
   */
  createOrReplace<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: AllDocumentsMutationOptions
  ): Promise<SanityDocument<R>[]>

  /**
   * Create a document if it does not exist, or replace a document with the same document ID
   * Returns a promise that resolves to a mutation result object containing the ID of the created document.
   *
   * @param document Document to either create or replace
   * @param options Mutation options
   */
  createOrReplace<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: FirstDocumentIdMutationOptions
  ): Promise<SingleMutationResult>

  /**
   * Create a document if it does not exist, or replace a document with the same document ID
   * Returns a promise that resolves to a mutation result object containing the created document ID.
   *
   * @param document Document to either create or replace
   * @param options Mutation options
   */
  createOrReplace<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options: AllDocumentIdsMutationOptions
  ): Promise<MultipleMutationResult>

  /**
   * Create a document if it does not exist, or replace a document with the same document ID
   * Returns a promise that resolves to the created document.
   *
   * @param document Document to either create or replace
   * @param options Mutation options
   */
  createOrReplace<R = any>(
    document: IdentifiedSanityDocumentStub<R>,
    options?: BaseMutationOptions
  ): Promise<SanityDocument<R>>

  /**
   * Deletes a document with the given document ID.
   * Returns a promise that resolves to the deleted document.
   *
   * @param id Document ID to delete
   * @param options Options for the mutation
   */
  delete<R = any>(id: string, options: FirstDocumentMutationOptions): Promise<SanityDocument<R>>

  /**
   * Deletes a document with the given document ID.
   * Returns a promise that resolves to an array containing the deleted document.
   *
   * @param id Document ID to delete
   * @param options Options for the mutation
   */
  delete<R = any>(id: string, options: AllDocumentsMutationOptions): Promise<SanityDocument<R>[]>

  /**
   * Deletes a document with the given document ID.
   * Returns a promise that resolves to a mutation result object containing the deleted document ID.
   *
   * @param id Document ID to delete
   * @param options Options for the mutation
   */
  delete(id: string, options: FirstDocumentIdMutationOptions): Promise<SingleMutationResult>

  /**
   * Deletes a document with the given document ID.
   * Returns a promise that resolves to a mutation result object containing the deleted document ID.
   *
   * @param id Document ID to delete
   * @param options Options for the mutation
   */
  delete(id: string, options: AllDocumentIdsMutationOptions): Promise<MultipleMutationResult>

  /**
   * Deletes a document with the given document ID.
   * Returns a promise that resolves to the deleted document.
   *
   * @param id Document ID to delete
   * @param options Options for the mutation
   */
  delete<R = any>(id: string, options?: BaseMutationOptions): Promise<SanityDocument<R>>

  /**
   * Deletes one or more documents matching the given query or document ID.
   * Returns a promise that resolves to first deleted document.
   *
   * @param selection An object with either an `id` or `query` key defining what to delete
   * @param options Options for the mutation
   */
  delete<R = any>(
    selection: MutationSelection,
    options: FirstDocumentMutationOptions
  ): Promise<SanityDocument<R>>

  /**
   * Deletes one or more documents matching the given query or document ID.
   * Returns a promise that resolves to an array containing the deleted documents.
   *
   * @param selection An object with either an `id` or `query` key defining what to delete
   * @param options Options for the mutation
   */
  delete<R = any>(
    selection: MutationSelection,
    options: AllDocumentsMutationOptions
  ): Promise<SanityDocument<R>[]>

  /**
   * Deletes one or more documents matching the given query or document ID.
   * Returns a promise that resolves to a mutation result object containing the ID of the first deleted document.
   *
   * @param selection An object with either an `id` or `query` key defining what to delete
   * @param options Options for the mutation
   */
  delete(
    selection: MutationSelection,
    options: FirstDocumentIdMutationOptions
  ): Promise<SingleMutationResult>

  /**
   * Deletes one or more documents matching the given query or document ID.
   * Returns a promise that resolves to a mutation result object containing the document IDs that were deleted.
   *
   * @param selection An object with either an `id` or `query` key defining what to delete
   * @param options Options for the mutation
   */
  delete(
    selection: MutationSelection,
    options: AllDocumentIdsMutationOptions
  ): Promise<MultipleMutationResult>

  /**
   * Deletes one or more documents matching the given query or document ID.
   * Returns a promise that resolves to first deleted document.
   *
   * @param selection An object with either an `id` or `query` key defining what to delete
   * @param options Options for the mutation
   */
  delete<R = any>(
    selection: MutationSelection,
    options?: BaseMutationOptions
  ): Promise<SanityDocument<R>>

  /**
   * Perform mutation operations against the configured dataset
   * Returns a promise that resolves to the first mutated document.
   *
   * @param operations Mutation operations to execute
   * @param options Mutation options
   */
  mutate<R = any>(
    operations: Mutation<R>[] | Patch | Transaction,
    options: FirstDocumentMutationOptions
  ): Promise<SanityDocument<R>>

  /**
   * Perform mutation operations against the configured dataset.
   * Returns a promise that resolves to an array of the mutated documents.
   *
   * @param operations Mutation operations to execute
   * @param options Mutation options
   */
  mutate<R = any>(
    operations: Mutation<R>[] | Patch | Transaction,
    options: AllDocumentsMutationOptions
  ): Promise<SanityDocument<R>[]>

  /**
   * Perform mutation operations against the configured dataset
   * Returns a promise that resolves to a mutation result object containing the document ID of the first mutated document.
   *
   * @param operations Mutation operations to execute
   * @param options Mutation options
   */
  mutate<R = any>(
    operations: Mutation<R>[] | Patch | Transaction,
    options: FirstDocumentIdMutationOptions
  ): Promise<SingleMutationResult>

  /**
   * Perform mutation operations against the configured dataset
   * Returns a promise that resolves to a mutation result object containing the mutated document IDs.
   *
   * @param operations Mutation operations to execute
   * @param options Mutation options
   */
  mutate<R>(
    operations: Mutation<R>[] | Patch | Transaction,
    options: AllDocumentIdsMutationOptions
  ): Promise<MultipleMutationResult>

  /**
   * Perform mutation operations against the configured dataset
   * Returns a promise that resolves to the first mutated document.
   *
   * @param operations Mutation operations to execute
   * @param options Mutation options
   */
  mutate<R = any>(
    operations: Mutation<R>[] | Patch | Transaction,
    options?: BaseMutationOptions
  ): Promise<SanityDocument<R>>

  /**
   * Create a new buildable patch of operations to perform
   *
   * @param documentId Document ID to patch
   * @param operations Optional object of patch operations to initialize the patch instance with
   */
  patch(documentId: string | MutationSelection, operations?: PatchOperations): Patch

  /**
   * Create a new transaction of mutations
   *
   * @param operations Optional array of mutation operations to initialize the transaction instance with
   */
  transaction<R = any>(operations?: Mutation<R>[]): Transaction

  // "Internals", should generally not be used externally
  /**
   * DEPRECATED: Returns whether or not this client is using the Promise API (otherwise it is using observables)
   *
   * @deprecated Should be an internal concern
   */
  isPromiseAPI(): boolean

  /**
   * DEPRECATED: Get a Sanity API URL for the URI provided
   *
   * @deprecated Should be an internal concern
   * @param uri URI/path to build URL for
   * @param canUseCdn Whether or not to allow using the API CDN for this route
   */
  getUrl(uri: string, canUseCdn?: boolean): string

  /**
   * DEPRECATED: Get a Sanity API URL for the data operation and path provided
   *
   * @deprecated Should be an internal concern
   * @param operation Data operation
   * @param path Path to append
   */
  getDataUrl(operation: string, path?: string): string

  /**
   * DEPRECATED: Perform an HTTP request against the Sanity API
   *
   * @deprecated Use your own request library!
   * @param options Request options
   */
  request(options: RawRequestOptions): Promise<any>

  /**
   * DEPRECATED: Perform an HTTP request a `/data` sub-endpoint
   *
   * @deprecated Use your own request library!
   * @param endpoint Endpoint to hit (mutate, query etc)
   * @param body Request body
   * @param options Request options
   */
  dataRequest(endpoint: string, body: unknown, options?: BaseMutationOptions): Promise<any>
}

export interface ClientConstructor {
  Patch: typeof Patch
  Transaction: typeof Transaction
  ClientError: typeof ClientError
  ServerError: typeof ServerError
  requester: GetItRequester

  new (config: ClientConfig): SanityClient
  (config: ClientConfig): SanityClient
}

declare const SanityClientConstructor: ClientConstructor
export default SanityClientConstructor
