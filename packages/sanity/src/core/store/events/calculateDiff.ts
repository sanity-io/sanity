import {diffInput} from '@sanity/diff'
import {type SanityDocument, type TransactionLogEventWithEffects} from '@sanity/types'
import {applyPatch, incremental} from 'mendoza'

import {type Annotation, type ObjectDiff} from '../../field'
import {wrapValue} from '../_legacy/history/history/diffValue'
import {type DocumentGroupEvent, isEditDocumentVersionEvent} from './types'

type EventMeta = {
  transactionIndex: number
  event?: DocumentGroupEvent
} | null

function omitRev(document: SanityDocument): Omit<SanityDocument, '_rev'> {
  const {_rev, ...doc} = document
  return doc
}

function annotationForTransactionIndex(
  transactions: TransactionLogEventWithEffects[],
  idx: number,
  event?: DocumentGroupEvent,
) {
  const tx = transactions[idx]
  if (!tx) return null

  return {
    timestamp: tx.timestamp,
    author: tx.author,
    event: event,
  }
}

function extractAnnotationForFromInput(
  transactions: TransactionLogEventWithEffects[],
  meta: EventMeta,
): Annotation {
  if (meta) {
    // The next transaction is where it disappeared:
    return annotationForTransactionIndex(transactions, meta.transactionIndex + 1, meta.event)
  }

  // Fallback: if meta is null, the value existed initially and was changed/removed
  // by the first transaction in our range
  if (transactions.length > 0) {
    return annotationForTransactionIndex(transactions, 0)
  }

  return null
}
function extractAnnotationForToInput(
  transactions: TransactionLogEventWithEffects[],
  meta: EventMeta,
): Annotation {
  if (meta) {
    return annotationForTransactionIndex(transactions, meta.transactionIndex, meta.event)
  }

  return null
}

function diffValue({
  transactions,
  fromValue,
  fromRaw,
  toValue,
  toRaw,
}: {
  transactions: TransactionLogEventWithEffects[]
  fromValue: incremental.Value<EventMeta>
  fromRaw: Omit<SanityDocument, '_rev'>
  toValue: incremental.Value<EventMeta>
  toRaw: Omit<SanityDocument, '_rev'>
}) {
  const fromInput = wrapValue<EventMeta>(fromValue, fromRaw, {
    fromValue(value) {
      return extractAnnotationForFromInput(transactions, value.endMeta)
    },
    fromMeta(meta) {
      return extractAnnotationForFromInput(transactions, meta)
    },
  })

  const toInput = wrapValue<EventMeta>(toValue, toRaw, {
    fromValue(value) {
      return extractAnnotationForToInput(transactions, value.startMeta)
    },
    fromMeta(meta) {
      return extractAnnotationForToInput(transactions, meta)
    },
  })
  return diffInput(fromInput, toInput)
}

export function calculateDiff({
  initialDoc,
  documentId,
  transactions,
  events = [],
}: {
  initialDoc: SanityDocument
  finalDoc?: SanityDocument
  transactions: TransactionLogEventWithEffects[]
  events: DocumentGroupEvent[]
  documentId: string
}) {
  const initialValue = incremental.wrap<EventMeta>(omitRev(initialDoc), null)
  let document = incremental.wrap<EventMeta>(omitRev(initialDoc), null)
  let finalDocument = omitRev(initialDoc)
  transactions.forEach((transaction, index) => {
    const meta: EventMeta = {
      transactionIndex: index,
      event: events.find(
        (event) =>
          !isEditDocumentVersionEvent(event) &&
          'revisionId' in event &&
          event.revisionId === transaction.id,
      ),
    }
    const effect = transaction.effects[documentId]
    if (effect) {
      document = incremental.applyPatch(document, effect.apply, meta)
      finalDocument = applyPatch(finalDocument, effect.apply)
    }
  })

  const diff = diffValue({
    transactions,
    fromValue: initialValue,
    fromRaw: initialDoc,
    toValue: document,
    toRaw: finalDocument,
  }) as ObjectDiff
  return diff
}
