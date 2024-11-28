import {
  type MendozaEffectPair,
  type MendozaPatch,
  type TransactionLogEventWithEffects,
} from '@sanity/types'

import {getVersionFromId} from '../../util/draftUtils'
import {
  type EditDocumentVersionEvent,
  isEditDocumentVersionEvent,
  type UpdateLiveDocumentEvent,
} from './types'
import {isWithinMergeWindow} from './utils'

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

export function getEditEvents(
  transactions: TransactionLogEventWithEffects[],
  documentId: string,
  liveEdit: boolean,
): (EditDocumentVersionEvent | UpdateLiveDocumentEvent)[] {
  const editTransactions = transactions
    .filter((tx) => {
      const effectState = getEffectState(tx.effects[documentId])
      // We only care about the transactions that have modified the document
      return effectState === 'upsert'
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
          type: 'UpdateLiveDocument',
          documentId: documentId,
          revisionId: transaction.id,
          author: transaction.author,
        } satisfies UpdateLiveDocumentEvent)
      : ({
          type: 'EditDocumentVersion',
          id: transaction.id,
          timestamp: transaction.timestamp,
          author: transaction.author,
          contributors: [transaction.author],
          releaseId: getVersionFromId(documentId),
          revisionId: transaction.id,

          // TODO: Do we need the transactions? It could be useful to avoid refetching the transactions
          transactions: [getEditTransaction(transaction)],
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
