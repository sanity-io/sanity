import {
  type SanityDocument,
  type TransactionLogEventWithEffects,
  type TransactionLogEventWithMutations,
} from '@sanity/types'

import {type DocumentRemoteMutationEvent} from '../../document/buffered-doc/types'
import {type WithVersion} from '../../document/document-pair/checkoutPair'
import {BASE_TIME, DOCUMENT_ID, DRAFT_ID} from './events.fixture'

export type TranslogEntry = TransactionLogEventWithEffects & TransactionLogEventWithMutations

/**
 * Builds a mendoza effect pair using literal-value patches (`[0, value]` replaces the whole
 * document with `value`; `[0, null]` is the delete patch the store recognises).
 *
 * These are valid mendoza patches, so they can be replayed by `calculateDiff`/`getEditEvents`
 * consumers, with the caveat that a literal replacement attributes the entire document to the
 * transaction (fine for pipeline tests; use recorded patches for fine-grained diff assertions).
 */
export function effectPair({
  before,
  after,
}: {
  before: Partial<SanityDocument> | null
  after: Partial<SanityDocument> | null
}): {apply: unknown[]; revert: unknown[]} {
  return {
    apply: [0, after],
    revert: [0, before],
  }
}

interface TransactionOptions {
  id?: string
  author?: string
  timestamp?: string
  /** The document id the effects apply to. Defaults to the draft id. */
  documentId?: string
  before?: Partial<SanityDocument> | null
  after?: Partial<SanityDocument> | null
}

/**
 * A transaction whose effect on `documentId` is a "modified" edit (neither apply nor revert is
 * a delete patch).
 */
export function editTransaction(options: TransactionOptions = {}): TranslogEntry {
  const {
    id = 'tx-edit',
    author = 'author-1',
    timestamp = BASE_TIME,
    documentId = DRAFT_ID,
    before = {_id: documentId, name: 'before'},
    after = {_id: documentId, name: 'after'},
  } = options
  return {
    id,
    timestamp,
    author,
    documentIDs: [documentId],
    effects: {[documentId]: effectPair({before, after})},
    mutations: [],
  }
}

/**
 * A transaction that creates `documentId` (revert patch is the delete patch `[0, null]`).
 */
export function createTransaction(options: TransactionOptions = {}): TranslogEntry {
  const {
    id = 'tx-create',
    author = 'author-1',
    timestamp = BASE_TIME,
    documentId = DRAFT_ID,
    after = {_id: documentId, name: 'created'},
  } = options
  return {
    id,
    timestamp,
    author,
    documentIDs: [documentId],
    effects: {[documentId]: effectPair({before: null, after})},
    mutations: [],
  }
}

/**
 * A transaction that deletes `documentId` (apply patch is the delete patch `[0, null]`).
 */
export function deleteTransaction(options: TransactionOptions = {}): TranslogEntry {
  const {
    id = 'tx-delete',
    author = 'author-1',
    timestamp = BASE_TIME,
    documentId = DRAFT_ID,
    before = {_id: documentId, name: 'before-delete'},
  } = options
  return {
    id,
    timestamp,
    author,
    documentIDs: [documentId],
    effects: {[documentId]: effectPair({before, after: null})},
    mutations: [],
  }
}

/**
 * A remote mutation event as emitted by the checkoutPair listeners, tagged with the document
 * variant it belongs to (what `getRemoteTransactionsSubscription` consumes).
 */
export function remoteMutationEvent(
  overrides: Partial<WithVersion<DocumentRemoteMutationEvent>> = {},
): WithVersion<DocumentRemoteMutationEvent> {
  return {
    type: 'remoteMutation',
    version: 'draft',
    transactionId: 'tx-remote',
    author: 'author-2',
    timestamp: new Date(BASE_TIME),
    head: {
      _id: DRAFT_ID,
      _type: 'testDocument',
      _createdAt: BASE_TIME,
      _updatedAt: BASE_TIME,
      _rev: 'tx-remote',
    },
    effects: effectPair({
      before: {_id: DRAFT_ID, name: 'before'},
      after: {_id: DRAFT_ID, name: 'after'},
    }),
    ...overrides,
  }
}

export {DOCUMENT_ID, DRAFT_ID}
