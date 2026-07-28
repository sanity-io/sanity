/**
 * Wire types for the mock Content Lake API. These mirror the shapes the
 * studio actually consumes — see the "Verified contracts" section of the
 * README and, canonically:
 * - packages/sanity/src/core/store/document/types.ts (MutationEvent)
 * - packages/sanity/src/core/store/document/getPairListener.ts (listen options)
 * - packages/sanity/src/core/store/document/document-pair/checkoutPair.ts (actions)
 */

export interface BenchDocument {
  _id: string
  _type: string
  _rev?: string
  _createdAt?: string
  _updatedAt?: string
  [key: string]: unknown
}

/** A raw mutation payload as sent by @sanity/client (exactly one key set). */
export interface MutationPayload {
  create?: BenchDocument
  createIfNotExists?: BenchDocument
  createOrReplace?: BenchDocument
  delete?: {id: string}
  patch?: {id: string; [key: string]: unknown}
}

/** Actions API payloads the studio submits (see checkoutPair.ts toActions). */
export type BenchAction =
  | {
      actionType: 'sanity.action.document.edit'
      draftId: string
      publishedId: string
      patch: Record<string, unknown>
    }
  | {
      actionType: 'sanity.action.document.create'
      publishedId: string
      attributes: BenchDocument
      ifExists?: 'fail' | 'ignore'
    }

/**
 * A `mutation` SSE event payload. `messageReceivedAt` is added client-side;
 * `previousRev` MUST be absent for `appear` transitions — the studio's
 * sequentializer chains `previousRev → resultRev` starting from the snapshot
 * `_rev`, and a nonexistent document has base revision `undefined`
 * (sequentializeListenerEvents.ts).
 */
export interface MutationEventPayload {
  documentId: string
  transactionId: string
  identity: string
  mutations: MutationPayload[]
  effects: {apply: unknown; revert: unknown}
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
