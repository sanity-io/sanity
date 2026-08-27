import {type SanityClient} from '@sanity/client'
import {diffInput, wrap} from '@sanity/diff'
import {type SanityDocument, type TransactionLogEventWithEffects} from '@sanity/types'
import {
  catchError,
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

import {type ObjectDiff} from '../../field/types'
import {calculateDiff} from './calculateDiff'
import {getDocumentTransactions} from './getDocumentTransactions'
import {HISTORY_CLEARED_EVENT_ID} from './getInitialFetchEvents'
import {
  type EventsStoreRevision,
  isCreateDocumentVersionEvent,
  isNonSelectableTerminalEvent,
} from './types'
import {type EventsObservableValue} from './useEventsStore'

const buildDocumentForDiffInput = (document?: Partial<SanityDocument> | null) => {
  if (!document) return {}
  // Remove internal fields and undefined values
  const {_id, _rev, _createdAt, _updatedAt, _type, ...rest} = JSON.parse(JSON.stringify(document))

  return rest
}

function removeDuplicatedTransactions(transactions: TransactionLogEventWithEffects[]) {
  const seen = new Set()
  return transactions.filter((tx) => {
    if (seen.has(tx.id)) return false
    seen.add(tx.id)
    return true
  })
}

/**
 * Raised (as an emitted `error` value, not thrown) by {@link getDocumentChanges} when the "since"
 * document can't be fetched from the history API — typically because history retention expired the
 * revision even though the events API still lists an event for it. The UI shows a dedicated
 * message for this error (see `ChangesError`).
 */
export class MissingSinceDocumentError extends Error {
  revisionId: string

  constructor(revisionId: string) {
    super(`Missing since document for revision ${revisionId}`)
    this.name = 'MissingSinceDocumentError'
    this.revisionId = revisionId
  }
}

/**
 * Emits the annotated diff `{loading, diff, error}` between the "since" and "to" revisions,
 * recomputing when either revision, the event list, or the remote transactions change.
 *
 * Since-document resolution:
 * - Uses `since$`'s document when present.
 * - Otherwise, when "to" points at a `createDocumentVersion` event, synthesizes an empty since
 *   document (`_id`/`_type`/`_rev` only) so the diff shows everything as added.
 * - Otherwise emits `MissingSinceDocumentError` when a since revision was requested but its
 *   document couldn't be fetched (history retention); `null` error while still loading.
 *
 * Transaction fetching (for attribution):
 * - A synthetic `historyCleared` since-revision yields no transactions.
 * - When viewing the latest version (no `to._rev`) and the since revision is unchanged, previously
 *   fetched transactions are reused and concatenated with live `remoteTransactions$` (deduped by
 *   id) instead of refetching.
 * - When both since and to are unchanged, transactions are fully reused.
 * - Otherwise transactions are fetched from the translog for the since→to range.
 *
 * Emits a fast, annotation-less preview diff (`startWith`) while transactions load. Errors from
 * the pipeline are logged and emitted as `{diff: null, error}`.
 *
 */
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
}): Observable<{loading: boolean; diff: ObjectDiff | null; error: Error | null}> {
  let lastResolvedSince: string | null = null
  let lastResolvedTo: string | null = null
  let lastTransactions: TransactionLogEventWithEffects[] = []

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return combineLatest(to$, since$, eventsObservable$).pipe(
    switchMap(([toObs, since, {events}]) => {
      const to = toObs?.document
      let sinceDoc: SanityDocument | undefined
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
        return of({
          loading: false,
          diff: null,
          error:
            since && !since.loading && since.revisionId
              ? /**
                 * In some cases, depending on history retention, we will get documents in the events api with a revision
                 * that may not exist anymore in the /history/documents endpoint.
                 *
                 * In those cases, we cannot show the comparison, because we don't have a "from" document to select, so we will show an error to the users.
                 */
                new MissingSinceDocumentError(since?.revisionId)
              : null,
        })
      }

      return remoteTransactions$.pipe(
        switchMap((remoteTx) => {
          // When the user doesn't have a revision selected, so he is viewing the latest version of the document in the form.
          // For this case, we can use the remote transactions to calculate the diff.
          const viewingLatest = !to?._rev
          const getTransactions = (): Observable<TransactionLogEventWithEffects[]> => {
            if (sinceDoc._rev === HISTORY_CLEARED_EVENT_ID) {
              return of([])
            }
            if (viewingLatest && events[0] && isNonSelectableTerminalEvent(events[0])) {
              return of([])
            }
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
                error: null,
              }
            }),
          )
        }),
        catchError((error) => {
          console.error(error)
          return of({loading: false, diff: null, error})
        }),
        startWith({
          loading: true,
          error: null,
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
