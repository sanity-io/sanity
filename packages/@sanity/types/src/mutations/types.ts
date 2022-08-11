export type InsertPatch =
  | {before: string; items: unknown[]}
  | {after: string; items: unknown[]}
  | {replace: string; items: unknown[]}

// Note: this is actually incorrect/invalid, but implemented as-is for backwards compatibility
export interface PatchOperations {
  set?: {[key: string]: unknown}
  setIfMissing?: {[key: string]: unknown}
  diffMatchPatch?: {[key: string]: unknown}
  unset?: string[]
  inc?: {[key: string]: number}
  dec?: {[key: string]: number}
  insert?: InsertPatch
  ifRevisionID?: string
}

export type MutationSelection = {query: string; params?: Record<string, unknown>} | {id: string}
export type PatchMutationOperation = PatchOperations & MutationSelection

export interface CreateMutation {
  create: {
    _type: string
    [key: string]: unknown
  }
}

export interface CreateOrReplaceMutation {
  createOrReplace: {
    _id: string
    _type: string
    [key: string]: unknown
  }
}

export interface CreateIfNotExistsMutation {
  createIfNotExists: {
    _id: string
    _type: string
    [key: string]: unknown
  }
}

export interface DeleteMutation {
  delete: MutationSelection
}

export interface PatchMutation {
  patch: PatchMutationOperation
}

export type Mutation =
  | CreateMutation
  | CreateOrReplaceMutation
  | CreateIfNotExistsMutation
  | DeleteMutation
  | PatchMutation

export type MutationOperationName =
  | 'create'
  | 'createOrReplace'
  | 'createIfNotExists'
  | 'delete'
  | 'patch'

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
