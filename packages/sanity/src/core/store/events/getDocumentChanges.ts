import {type SanityClient} from '@sanity/client'
import {diffInput, wrap} from '@sanity/diff'
import {type SanityDocument, type TransactionLogEventWithEffects} from '@sanity/types'
import {applyPatch, incremental} from 'mendoza'
import {
  combineLatest,
  from,
  map,
  type Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs'

import {type Annotation, type ObjectDiff} from '../../field'
import {wrapValue} from '../_legacy/history/history/diffValue'
import {getDocumentTransactions} from './getDocumentTransactions'
import {
  type DocumentGroupEvent,
  type EventsStoreRevision,
  isCreateDocumentVersionEvent,
  isEditDocumentVersionEvent,
} from './types'
import {type EventsObservableValue} from './useEventsStore'

const buildDocumentForDiffInput = (document?: Partial<SanityDocument> | null) => {
  if (!document) return {}
  // Remove internal fields and undefined values
  const {_id, _rev, _createdAt, _updatedAt, _type, ...rest} = JSON.parse(JSON.stringify(document))

  return rest
}

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

function calculateDiff({
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

function removeDuplicatedTransactions(transactions: TransactionLogEventWithEffects[]) {
  const seen = new Set()
  return transactions.filter((tx) => {
    if (seen.has(tx.id)) return false
    seen.add(tx.id)
    return true
  })
}

export function getDocumentChanges({
  eventsObservable$,
  documentId,
  client,
  to$,
  since$,
  remoteTransactions$,
}: {
  eventsObservable$: Observable<EventsObservableValue>
  documentId: string
  client: SanityClient
  to$: Observable<EventsStoreRevision | null>
  remoteTransactions$: Observable<TransactionLogEventWithEffects[]>
  since$: Observable<EventsStoreRevision | null>
}): Observable<{loading: boolean; diff: ObjectDiff | null}> {
  let lastResolvedSince: string | null = null
  let lastResolvedTo: string | null = null
  let lastTransactions: TransactionLogEventWithEffects[] = []

  return combineLatest(to$, since$, eventsObservable$).pipe(
    switchMap(([toObs, since, {events}]) => {
      const to = toObs?.document
      let sinceDoc: SanityDocument | undefined = undefined
      if (since?.document) {
        sinceDoc = since?.document
      } else {
        const selectedToEvent = events.find((event) => event.id === to?._rev)
        const isShowingCreationEvent =
          selectedToEvent && isCreateDocumentVersionEvent(selectedToEvent)
        if (isShowingCreationEvent && to) {
          sinceDoc = {_type: to._type, _id: to._id, _rev: to._rev} as SanityDocument
        }
      }
      if (!sinceDoc) {
        return of({loading: false, diff: null})
      }

      return remoteTransactions$.pipe(
        switchMap((remoteTx) => {
          // When the user doesn't have a revision selected, so he is viewing the latest version of the document in the form.
          // For this case, we can use the remote transactions to calculate the diff.
          const viewingLatest = !to?._rev
          const getTransactions = (): Observable<TransactionLogEventWithEffects[]> => {
            if (viewingLatest && lastResolvedSince === sinceDoc._rev) {
              // The document has been previously resolved and it's on latest, we can use the remote transactions, we don't need to fetch them again
              return of(removeDuplicatedTransactions(lastTransactions.concat(remoteTx)))
            }
            if (
              lastResolvedSince &&
              lastResolvedSince === sinceDoc._rev &&
              lastResolvedTo &&
              lastResolvedTo === to?._rev
            ) {
              // The since and to haven't changed, use the same transactions.
              return of(lastTransactions)
            }
            return from(
              getDocumentTransactions({
                documentId,
                client,
                toTransaction: to?._rev,
                fromTransaction: sinceDoc._rev,
              }),
            )
          }
          return getTransactions().pipe(
            tap((transactions) => {
              lastResolvedSince = sinceDoc._rev
              lastTransactions = transactions
              if (to?._rev) {
                lastResolvedTo = to._rev
              }
            }),
            map((transactions) => {
              return {
                loading: false,
                diff: calculateDiff({documentId, initialDoc: sinceDoc, transactions, events}),
              }
            }),
          )
        }),
        startWith({
          loading: true,
          diff:
            sinceDoc && to
              ? (diffInput(
                  wrap(buildDocumentForDiffInput(sinceDoc), null),
                  wrap(buildDocumentForDiffInput(to), null),
                ) as ObjectDiff)
              : null,
        }),
        shareReplay(1),
      )
    }),
  )
}
