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
  type DocumentGroupEvent,
  type EventsObservableValue,
  type EventsStoreRevision,
  isCreateDocumentVersionEvent,
} from './types'

/**
 * Strips internal fields (`_id`, `_rev`, `_createdAt`, `_updatedAt`, `_type`) and `undefined`
 * values (via JSON round-trip) from a document so `@sanity/diff` only compares user content.
 * Returns `{}` for missing documents.
 */
export const buildDocumentForDiffInput = (document?: Partial<SanityDocument> | null) => {
  if (!document) return {}
  // Remove internal fields and undefined values
  const {_id, _rev, _createdAt, _updatedAt, _type, ...rest} = JSON.parse(JSON.stringify(document))

  return rest
}

/** Removes transactions with duplicate ids, keeping the first occurrence. */
export function removeDuplicatedTransactions(transactions: TransactionLogEventWithEffects[]) {
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
 * Resolves the "since" document to diff against:
 * - Uses `since`'s document when present.
 * - Otherwise, when "to" points at a `createDocumentVersion` event, synthesizes an empty since
 *   document (`_id`/`_type`/`_rev` only) so the diff shows everything as added.
 * - Otherwise returns no document, with a {@link MissingSinceDocumentError} when a since revision
 *   was requested but its document couldn't be fetched (history retention), or `null` error while
 *   the since revision is still loading.
 */
export function resolveSinceDocument({
  since,
  to,
  events,
}: {
  since: EventsStoreRevision | null
  to: SanityDocument | null | undefined
  events: DocumentGroupEvent[]
}): {sinceDoc: SanityDocument | undefined; error: MissingSinceDocumentError | null} {
  if (since?.document) {
    return {sinceDoc: since.document, error: null}
  }
  const selectedToEvent = events.find((event) => event.id === to?._rev)
  const isShowingCreationEvent = selectedToEvent && isCreateDocumentVersionEvent(selectedToEvent)
  if (isShowingCreationEvent && to) {
    return {sinceDoc: {_type: to._type, _id: to._id, _rev: to._rev} as SanityDocument, error: null}
  }
  return {
    sinceDoc: undefined,
    error:
      since && !since.loading && since.revisionId
        ? /**
           * In some cases, depending on history retention, we will get documents in the events api with a revision
           * that may not exist anymore in the /history/documents endpoint.
           *
           * In those cases, we cannot show the comparison, because we don't have a "from" document to select, so we will show an error to the users.
           */
          new MissingSinceDocumentError(since.revisionId)
        : null,
  }
}

/**
 * Small cache of the transactions fetched for the last resolved `[since, to]` range, so
 * {@link getDocumentChanges} can avoid refetching the translog when only the remote transactions
 * change (viewing latest) or when neither side of the range changed.
 */
export function createTransactionsCache() {
  let lastResolvedSince: string | null = null
  let lastResolvedTo: string | null = null
  let lastTransactions: TransactionLogEventWithEffects[] = []
  let lastRemoteTransactionsCount = 0

  return {
    /**
     * Returns the transactions to reuse for the given range, or `null` when a fetch is needed:
     * - Viewing latest (no `toRev`) with an unchanged since: reuses the cached transactions
     *   concatenated with the live remote transactions (deduped by id) — unless the remote buffer
     *   *shrank* (it was cleared after hitting its cap), in which case the cleared transactions
     *   are only in the translog and the range must be refetched.
     * - Unchanged since *and* to: reuses the cached transactions as-is.
     */
    get({
      sinceRev,
      toRev,
      viewingLatest,
      remoteTransactions,
    }: {
      sinceRev: string
      toRev: string | undefined
      viewingLatest: boolean
      remoteTransactions: TransactionLogEventWithEffects[]
    }): TransactionLogEventWithEffects[] | null {
      const remoteShrank = remoteTransactions.length < lastRemoteTransactionsCount
      lastRemoteTransactionsCount = remoteTransactions.length
      if (viewingLatest && lastResolvedSince === sinceRev) {
        if (remoteShrank) {
          // The remote buffer was cleared: its transactions are only in the translog now.
          return null
        }
        // The document has been previously resolved and it's on latest, we can use the remote transactions, we don't need to fetch them again
        return removeDuplicatedTransactions(lastTransactions.concat(remoteTransactions))
      }
      if (
        lastResolvedSince &&
        lastResolvedSince === sinceRev &&
        lastResolvedTo &&
        lastResolvedTo === toRev
      ) {
        // The since and to haven't changed, use the same transactions.
        return lastTransactions
      }
      return null
    },
    set({
      sinceRev,
      toRev,
      transactions,
    }: {
      sinceRev: string
      toRev: string | undefined
      transactions: TransactionLogEventWithEffects[]
    }): void {
      lastResolvedSince = sinceRev
      lastTransactions = transactions
      if (toRev) {
        lastResolvedTo = toRev
      }
    },
  }
}

/**
 * Emits the annotated diff `{loading, diff, error}` between the "since" and "to" revisions,
 * recomputing when either revision, the event list, or the remote transactions change.
 *
 * Since-document resolution is handled by {@link resolveSinceDocument} (which also decides when to
 * emit a `MissingSinceDocumentError`).
 *
 * Transaction fetching (for attribution):
 * - A synthetic `historyCleared` since-revision yields no transactions.
 * - Otherwise previously fetched transactions are reused via {@link createTransactionsCache} when
 *   the range is unchanged (concatenated with live `remoteTransactions$` while viewing latest),
 *   and fetched from the translog for the since→to range when not.
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
  const transactionsCache = createTransactionsCache()

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return combineLatest(to$, since$, eventsObservable$).pipe(
    switchMap(([toObs, since, {events}]) => {
      const to = toObs?.document
      const {sinceDoc, error: sinceError} = resolveSinceDocument({since, to, events})

      if (!sinceDoc) {
        return of({loading: false, diff: null, error: sinceError})
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
            const cached = transactionsCache.get({
              sinceRev: sinceDoc._rev,
              toRev: to?._rev,
              viewingLatest,
              remoteTransactions: remoteTx,
            })
            if (cached !== null) {
              return of(cached)
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
              transactionsCache.set({sinceRev: sinceDoc._rev, toRev: to?._rev, transactions})
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
