import {diffInput, wrap} from '@sanity/diff'
import {type SanityDocument, type TransactionLogEventWithEffects} from '@sanity/types'
import {incremental} from 'mendoza'
import {from, map, type Observable, of, startWith} from 'rxjs'
import {type SanityClient} from 'sanity'

import {type Annotation, type ObjectDiff} from '../../field'
import {wrapValue} from '../_legacy/history/history/diffValue'
import {getDocumentTransactions} from './getDocumentTransactions'
import {type DocumentGroupEvent} from './types'

const buildDocumentForDiffInput = (document?: Partial<SanityDocument> | null) => {
  if (!document) return {}
  // Remove internal fields and undefined values
  const {_id, _rev, _createdAt, _updatedAt, _type, _version, ...rest} = JSON.parse(
    JSON.stringify(document),
  )

  return rest
}

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
  fromValue,
  fromRaw,
  toValue,
  toRaw,
}: {
  transactions: TransactionLogEventWithEffects[]
  fromValue: incremental.Value<EventMeta>
  fromRaw: unknown
  toValue: incremental.Value<EventMeta>
  toRaw: unknown
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

function calculateDiff({
  initialDoc,
  documentId,
  finalDoc,
  transactions,
  events = [],
}: {
  initialDoc: SanityDocument
  finalDoc: SanityDocument
  transactions: TransactionLogEventWithEffects[]
  events: DocumentGroupEvent[]
  documentId: string
}) {
  const initialValue = incremental.wrap<EventMeta>(omitRev(initialDoc), null)
  let document = incremental.wrap<EventMeta>(omitRev(initialDoc), null)

  transactions.forEach((transaction, index) => {
    const meta: EventMeta = {
      transactionIndex: index,
      event: events.find(
        (event) =>
          event.type !== 'EditDocumentVersion' &&
          'revisionId' in event &&
          event.revisionId === transaction.id,
      ),
    }
    const effect = transaction.effects[documentId]
    if (effect) {
      document = incremental.applyPatch(document, effect.apply, meta)
    }
  })

  const diff = diffValue({
    transactions,
    fromValue: initialValue,
    fromRaw: initialDoc,
    toValue: document,
    toRaw: finalDoc,
  })
  return diff
}

export function getDocumentChanges({
  events,
  documentId,
  client,
  to,
  since,
}: {
  events: DocumentGroupEvent[]
  documentId: string
  client: SanityClient
  to: SanityDocument
  since: SanityDocument | null
}): Observable<{loading: boolean; diff: ObjectDiff | null}> {
  // Extremely raw implementation to get the differences between two versions.
  // Transactions could be cached, given they are not gonna change EVER.
  // We could also cache the diff, given it's not gonna change either
  // Transactions are in an order, so if we have [rev4, rev3, rev2] and we already got [rev4, rev3] we can just get the diff between rev3 and rev2 and increment it.
  // We need to expose this differently, as we need to also expose the transactions for versions and drafts, this implementation only works for published.
  // We need to find a way to listen to the incoming transactions and in the case of published documents, refetch the events when a new transaction comes in.
  // For versions and drafts we can keep the list of transactions updated just by the received transactions.
  if (!since) {
    return of({loading: false, diff: null})
  }

  return from(
    getDocumentTransactions({
      documentId,
      client,
      toTransaction: to._rev,
      fromTransaction: since?._rev || to._rev,
    }),
  ).pipe(
    map((transactions) => {
      return {
        loading: false,
        diff: calculateDiff({
          documentId,
          initialDoc: since,
          finalDoc: to,
          transactions,
          events: events,
        }) as ObjectDiff,
      }
    }),
    startWith({
      loading: true,
      diff: diffInput(
        wrap(buildDocumentForDiffInput(since), null),
        wrap(buildDocumentForDiffInput(to), null),
      ) as ObjectDiff,
    }),
  )
}
