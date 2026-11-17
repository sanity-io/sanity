import {
  type MendozaEffectPair,
  type MendozaPatch,
  type TransactionLogEventWithEffects,
} from '@sanity/types'

import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  isEditDocumentVersionEvent,
  type UpdateLiveDocumentEvent,
} from './types'
import {isWithinMergeWindow} from './utils'

/**
 * Classifies a mendoza effect pair by what it did to the document:
 * - `'deleted'`: the apply patch deletes the document (`[0, null]`).
 * - `'created'`: the revert patch deletes the document, i.e. applying it forward created it.
 * - `'modified'`: an effect exists but neither creates nor deletes.
 * - `'noop'`: no effect for this document in the transaction.
 *
 * Used to filter edit transactions (only `'modified'` become edit events) and to decide whether a
 * remote mutation requires refetching the event list (created/deleted look like lifecycle events).
 */
export function getEffectState(
  effect?: MendozaEffectPair,
): 'noop' | 'deleted' | 'modified' | 'created' {
  const modified = Boolean(effect)
  const deleted = effect && isDeletePatch(effect?.apply)
  const created = effect && isDeletePatch(effect?.revert)

  if (deleted) {
    return 'deleted'
  }
  if (created) {
    return 'created'
  }

  if (modified) {
    return 'modified'
  }

  return 'noop'
}

function isDeletePatch(patch: MendozaPatch): boolean {
  return patch[0] === 0 && patch[1] === null
}

type EditTransaction = EditDocumentVersionEvent['transactions'][number]

const getEditTransaction = (transaction: TransactionLogEventWithEffects): EditTransaction => {
  return {
    type: 'editTransaction',
    author: transaction.author,
    timestamp: transaction.timestamp,
    revisionId: transaction.id,
  }
}

/**
 * Groups edit transactions into `editDocumentVersion` events, newest first: a transaction within
 * the merge window (5 min) of the *current group's newest* transaction joins that group, otherwise
 * it starts a new event. Each event takes its id, revision, timestamp and author from its newest
 * transaction, and lists every distinct author in `contributors`.
 */
function groupEditTransactions(
  transactions: EditTransaction[],
  documentId: string,
): EditDocumentVersionEvent[] {
  const result: EditDocumentVersionEvent[] = []
  const newestFirst = transactions.toSorted(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  )
  for (const transaction of newestFirst) {
    const group = result.at(-1)
    if (group && isWithinMergeWindow(group.timestamp, transaction.timestamp)) {
      group.transactions.push(transaction)
      if (!group.contributors.includes(transaction.author)) {
        group.contributors.push(transaction.author)
      }
      continue
    }
    result.push({
      type: 'editDocumentVersion',
      documentId,
      id: transaction.revisionId,
      timestamp: transaction.timestamp,
      author: transaction.author,
      contributors: [transaction.author],
      revisionId: transaction.revisionId,
      transactions: [transaction],
      documentVariantType: getDocumentVariantType(documentId),
    })
  }
  return result
}

/**
 * Projects grouped edit events onto the `updateLiveDocument` shape a live-edit document shows.
 * The remote-edits observable applies this after {@link getEditEvents} when the schema is live
 * edit.
 *
 * Known quirk: merged (in-window) transactions are dropped entirely, including those by other
 * authors, losing their attribution (tracked as a known issue; contrast with
 * {@link squashLiveEditEvents}, which only squashes same-author events).
 */
export function toUpdateLiveDocumentEvents(
  events: EditDocumentVersionEvent[],
): UpdateLiveDocumentEvent[] {
  return events.map((event) => ({
    id: event.id,
    timestamp: event.timestamp,
    type: 'updateLiveDocument',
    documentId: event.documentId,
    revisionId: event.revisionId,
    author: event.author,
    documentVariantType: event.documentVariantType,
  }))
}

/**
 * Builds synthetic `editDocumentVersion` events from translog transactions — the events API does
 * not expose edits, so the studio derives them client-side (both for the initial fetch and for
 * real-time remote mutations, which {@link mergeEditEvents} then regroups together). Live-edit
 * documents project these events with {@link toUpdateLiveDocumentEvents} in the remote-edits
 * observable.
 *
 * Behavior:
 * - Only transactions whose effect on `documentId` is `'modified'` are considered
 *   (see {@link getEffectState}); creations and deletions are lifecycle events, not edits.
 * - Transactions are sorted newest-first, then grouped: a transaction within the merge window
 *   (5 min) of the *current group's newest* transaction is merged into that group; otherwise it
 *   starts a new event. Note the window is anchored to the group head, not the previous
 *   transaction, so a continuous editing session splits every 5 minutes.
 * - Merged transactions are appended to `transactions` and distinct authors accumulate in
 *   `contributors`. The event id/revisionId is the *newest* transaction id of the group.
 */
export function getEditEvents(
  transactions: TransactionLogEventWithEffects[],
  documentId: string,
): EditDocumentVersionEvent[] {
  return groupEditTransactions(
    transactions
      // We only care about the transactions that have modified the document
      .filter((tx) => getEffectState(tx.effects[documentId]) === 'modified')
      .map(getEditTransaction),
    documentId,
  )
}

/**
 * Regroups the edit events of a newest-first event list as if all their transactions had been
 * grouped by a single {@link getEditEvents} call. The events store gets edit events from two
 * places, the translog fetched with the events and the transactions received live afterwards,
 * and each one only groups its own transactions; without this, the same edits would be grouped
 * differently depending on when the document was loaded.
 *
 * Only consecutive edit events are regrouped: any other event between them (a creation, a
 * publish, a discard) ends the run, so edits are never grouped across a lifecycle change. A
 * transaction found in more than one event (fetched, and also received live) is kept once. Edit
 * events nested under an expanded publish (they have a `parentId`) are left as they are.
 */
export function mergeEditEvents(events: DocumentGroupEvent[]): DocumentGroupEvent[] {
  const result: DocumentGroupEvent[] = []
  let run: EditDocumentVersionEvent[] = []
  const endRun = () => {
    if (run.length > 1) {
      const seen = new Set<string>()
      const transactions = run
        .flatMap((event) => event.transactions)
        .filter((transaction) => {
          if (seen.has(transaction.revisionId)) return false
          seen.add(transaction.revisionId)
          return true
        })
      result.push(...groupEditTransactions(transactions, run[0].documentId))
    } else {
      result.push(...run)
    }
    run = []
  }

  for (const event of events) {
    if (isEditDocumentVersionEvent(event) && !event.parentId) {
      run.push(event)
      continue
    }
    endRun()
    result.push(event)
  }
  endRun()
  return result
}
