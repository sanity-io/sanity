/** @internal */
export type InsertPatch =
  | {before: string; items: unknown[]}
  | {after: string; items: unknown[]}
  | {replace: string; items: unknown[]}

/**
 * NOTE: this is actually incorrect/invalid, but implemented as-is for backwards compatibility
 *
 * @internal
 */
export interface PatchOperations {
  set?: {[key: string]: unknown}
  setIfMissing?: {[key: string]: unknown}
  merge?: {[key: string]: unknown}
  diffMatchPatch?: {[key: string]: string}
  unset?: string[]
  inc?: {[key: string]: number}
  dec?: {[key: string]: number}
  insert?: InsertPatch
  ifRevisionID?: string
}

/** @internal */
export type MutationSelection = {query: string; params?: Record<string, unknown>} | {id: string}

/** @internal */
export type PatchMutationOperation = PatchOperations & MutationSelection

/** @internal */
export interface CreateMutation {
  create: {
    _id?: string
    _type: string
    [key: string]: unknown
  }
}

/** @internal */
export interface CreateOrReplaceMutation {
  createOrReplace: {
    _id: string
    _type: string
    [key: string]: unknown
  }
}

/** @internal */
export interface CreateIfNotExistsMutation {
  createIfNotExists: {
    _id: string
    _type: string
    [key: string]: unknown
  }
}

/** @internal */
export interface DeleteMutation {
  delete: MutationSelection
}

/** @internal */
export interface PatchMutation {
  patch: PatchMutationOperation
}

/** @internal */
export type Mutation =
  | CreateMutation
  | CreateOrReplaceMutation
  | CreateIfNotExistsMutation
  | DeleteMutation
  | PatchMutation

/** @internal */
export type MutationOperationName =
  | 'create'
  | 'createOrReplace'
  | 'createIfNotExists'
  | 'delete'
  | 'patch'

/** @internal */
export interface SingleMutationResult {
  transactionId: string
  documentId: string
  results: {id: string}[]
}

/** @internal */
export interface MultipleMutationResult {
  transactionId: string
  documentIds: string[]
  results: {id: string}[]
}
