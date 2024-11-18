import {diffInput} from '@sanity/diff'
import {type SanityDocument, type TransactionLogEventWithEffects} from '@sanity/types'
import {incremental} from 'mendoza'

import {type Annotation} from '../../field'
import {wrapValue} from '../_legacy/history/history/diffValue'
import {type DocumentGroupEvent} from './types'

type EventMeta = {
  transactionIndex: number
  event?: DocumentGroupEvent
} | null

function omitRev(document: SanityDocument | undefined) {
  if (document === undefined) {
    return undefined
  }
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
  from,
  fromRaw,
  to,
  toRaw,
}: {
  transactions: TransactionLogEventWithEffects[]
  from: incremental.Value<EventMeta>
  fromRaw: unknown
  to: incremental.Value<EventMeta>
  toRaw: unknown
}) {
  const fromInput = wrapValue<EventMeta>(from, fromRaw, {
    fromValue(value) {
      return extractAnnotationForFromInput(transactions, value.endMeta)
    },
    fromMeta(meta) {
      return extractAnnotationForFromInput(transactions, meta)
    },
  })

  const toInput = wrapValue<EventMeta>(to, toRaw, {
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
  finalDoc,
  transactions,
  events = [],
}: {
  initialDoc: SanityDocument
  finalDoc: SanityDocument
  transactions: TransactionLogEventWithEffects[]
  events: DocumentGroupEvent[]
}) {
  const documentId = initialDoc._id

  const initialValue = incremental.wrap<EventMeta>(omitRev(initialDoc), null)
  let document = incremental.wrap<EventMeta>(omitRev(initialDoc), null)

  transactions.forEach((transaction, index) => {
    const meta: EventMeta = {
      transactionIndex: index,
      event: events.find((event) => 'revisionId' in event && event.revisionId === transaction.id),
    }
    const effect = transaction.effects[documentId]
    if (effect) {
      document = incremental.applyPatch(document, effect.apply, meta)
    }
  })
  const diff = diffValue({
    transactions,
    from: initialValue,
    fromRaw: initialDoc,
    to: document,
    toRaw: finalDoc,
  })
  return diff
}
