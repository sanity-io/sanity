import {
  type MendozaEffectPair,
  type MendozaPatch,
  type TransactionLogEventWithEffects,
} from '@sanity/types'

import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {
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

const getEditTransaction = (
  transaction: TransactionLogEventWithEffects,
): EditDocumentVersionEvent['transactions'][number] => {
  return {
    type: 'editTransaction',
    author: transaction.author,
    timestamp: transaction.timestamp,
    revisionId: transaction.id,
  }
}

export function getEditEvents(
  transactions: TransactionLogEventWithEffects[],
  documentId: string,
  liveEdit: true,
): UpdateLiveDocumentEvent[]

export function getEditEvents(
  transactions: TransactionLogEventWithEffects[],
  documentId: string,
  liveEdit: false,
): EditDocumentVersionEvent[]

export function getEditEvents(
  transactions: TransactionLogEventWithEffects[],
  documentId: string,
  liveEdit: boolean,
): (EditDocumentVersionEvent | UpdateLiveDocumentEvent)[]
/**
 * Builds synthetic edit events from translog transactions — the events API does not expose edits,
 * so the studio derives them client-side (both for the initial fetch and for real-time remote
 * mutations).
 *
 * Behavior:
 * - Only transactions whose effect on `documentId` is `'modified'` are considered
 *   (see {@link getEffectState}); creations and deletions are lifecycle events, not edits.
 * - Transactions are sorted newest-first, then grouped: a transaction within the merge window
 *   (5 min) of the *current group's newest* transaction is merged into that group; otherwise it
 *   starts a new event. Note the window is anchored to the group head, not the previous
 *   transaction, so a continuous editing session splits every 5 minutes.
 * - `liveEdit: false` produces `editDocumentVersionEvent`s: merged transactions are appended to
 *   `transactions` and distinct authors accumulate in `contributors`. The event id/revisionId is
 *   the *newest* transaction id of the group.
 * - `liveEdit: true` produces `updateLiveDocument` events — one per group. Known quirk: merged
 *   (in-window) transactions are dropped entirely, including those by *other authors*, losing
 *   their attribution (tracked as a known issue; contrast with `squashLiveEditEvents`, which only
 *   squashes same-author events).
 */
export function getEditEvents(
  transactions: TransactionLogEventWithEffects[],
  documentId: string,
  liveEdit: boolean,
): (EditDocumentVersionEvent | UpdateLiveDocumentEvent)[] {
  const editTransactions = transactions
    .filter((tx) => {
      const effectState = getEffectState(tx.effects[documentId])
      // We only care about the transactions that have modified the document
      return effectState === 'modified'
    })
    // We sort the transactions by timestamp, newest first
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))

  const result: (EditDocumentVersionEvent | UpdateLiveDocumentEvent)[] = []
  for (const transaction of editTransactions) {
    // If result is empty, add the current event
    const event = liveEdit
      ? ({
          id: transaction.id,
          timestamp: transaction.timestamp,
          type: 'updateLiveDocument',
          documentId: documentId,
          revisionId: transaction.id,
          author: transaction.author,
          documentVariantType: getDocumentVariantType(documentId),
        } satisfies UpdateLiveDocumentEvent)
      : ({
          type: 'editDocumentVersion',
          documentId: documentId,
          id: transaction.id,
          timestamp: transaction.timestamp,
          author: transaction.author,
          contributors: [transaction.author],
          revisionId: transaction.id,
          transactions: [getEditTransaction(transaction)],
          documentVariantType: getDocumentVariantType(documentId),
        } satisfies EditDocumentVersionEvent)
    if (result.length === 0) {
      result.push(event)
      continue
    }

    const lastEvent = result[result.length - 1]

    if (isWithinMergeWindow(lastEvent.timestamp, event.timestamp)) {
      if (isEditDocumentVersionEvent(lastEvent)) {
        // Add the transaction event to the transactions
        lastEvent.transactions.push(getEditTransaction(transaction))
        if (!lastEvent.contributors.includes(event.author) && lastEvent.author !== event.author) {
          // Update event the contributors list
          lastEvent.contributors.push(event.author)
        }
      }
    } else {
      // If the time difference is greater than the window, add as a new event
      result.push(event)
    }
  }

  return result
}
