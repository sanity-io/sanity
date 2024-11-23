import {
  type MendozaEffectPair,
  type MendozaPatch,
  type TransactionLogEventWithEffects,
} from '@sanity/types'

import {getVersionFromId} from '../../util/draftUtils'
import {type EditDocumentVersionEvent} from './types'

export function getEffectState(
  effect?: MendozaEffectPair,
): 'unedited' | 'deleted' | 'upsert' | 'created' {
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
    return 'upsert'
  }

  return 'unedited'
}

function isDeletePatch(patch: MendozaPatch): boolean {
  return patch[0] === 0 && patch[1] === null
}

const MERGE_WINDOW = 5 * 60 * 1000 // 5 minutes

function isWithinMergeWindow(a: string, b: string) {
  return Math.abs(Date.parse(a) - Date.parse(b)) < MERGE_WINDOW
}

const getEditTransaction = (
  transaction: TransactionLogEventWithEffects,
): EditDocumentVersionEvent['transactions'][number] => {
  return {
    type: 'EditTransaction',
    author: transaction.author,
    timestamp: transaction.timestamp,
    revisionId: transaction.id,
  }
}
export type NotMergedEditEvent = Omit<
  EditDocumentVersionEvent,
  'fromRevisionId' | 'toRevisionId'
> & {
  transactionId: string
}
export function getEditEvents(
  transactions: TransactionLogEventWithEffects[],
  documentId: string,
): EditDocumentVersionEvent[] {
  const editTransactions = transactions
    .filter((tx) => {
      const effectState = getEffectState(tx.effects[documentId])
      // We only care about the transactions that have modified the document
      return effectState === 'upsert'
    })
    // We sort the transactions by timestamp, newest first
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))

  const result: EditDocumentVersionEvent[] = []
  for (const transaction of editTransactions) {
    // If result is empty, add the current event
    const event: EditDocumentVersionEvent = {
      type: 'EditDocumentVersion',
      id: transaction.id,
      timestamp: transaction.timestamp,
      author: transaction.author,
      authors: [transaction.author],
      releaseId: getVersionFromId(documentId),
      revisionId: transaction.id,
      fromRevisionId: transaction.id,
      transactions: [getEditTransaction(transaction)],
    }
    if (result.length === 0) {
      result.push(event)
      continue
    }

    const lastEvent = result[result.length - 1]

    if (isWithinMergeWindow(lastEvent.timestamp, event.timestamp)) {
      // Add the transaction event to the transactions
      lastEvent.transactions.push(getEditTransaction(transaction))
      if (!lastEvent.authors.includes(event.author)) {
        // Update event the authors list
        lastEvent.authors.push(event.author)
      }
      // Modify the from revision id to be the latest transaction
      lastEvent.fromRevisionId = transaction.id
    } else {
      // If the time difference is greater than the window, add as a new event
      result.push(event)
    }
  }

  return result
}
