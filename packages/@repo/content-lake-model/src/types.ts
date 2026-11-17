export interface ContentLakeDocument {
  _id: string
  _type: string
  _rev?: string
  _createdAt?: string
  _updatedAt?: string
  [key: string]: unknown
}

export type DocumentIndex = Record<string, ContentLakeDocument>

/** A raw mutation as `@sanity/client` sends it, with exactly one key set. */
export interface MutationPayload {
  create?: ContentLakeDocument
  createIfNotExists?: ContentLakeDocument
  createOrReplace?: ContentLakeDocument
  delete?: {id: string}
  patch?: {id: string; ifRevisionID?: string; [key: string]: unknown}
}

export type EditAction = {
  actionType: 'sanity.action.document.edit'
  draftId: string
  publishedId: string
  patch: Record<string, unknown>
}

export type CreateAction = {
  actionType: 'sanity.action.document.create'
  publishedId: string
  attributes: ContentLakeDocument
  ifExists?: 'fail' | 'ignore'
}

export type ContentLakeAction = EditAction | CreateAction

/**
 * A `mutation` listener event. `previousRev` is absent on `appear`: the studio chains revisions
 * from the snapshot's `_rev`, which is `undefined` for a missing document.
 */
export interface MutationEventPayload {
  documentId: string
  transactionId: string
  identity: string
  mutations: MutationPayload[]
  effects: {apply: unknown[]; revert: unknown[]}
  previousRev?: string
  resultRev: string
  timestamp: string
  transactionTotalEvents: number
  transactionCurrentEvent: number
  visibility: 'transaction'
  transition: 'update' | 'appear' | 'disappear'
}

export interface CommitResult {
  transactionId: string
  events: MutationEventPayload[]
  results: {id: string; operation: 'create' | 'update' | 'delete'}[]
}
