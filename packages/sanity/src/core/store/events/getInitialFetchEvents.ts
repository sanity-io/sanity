import {type SanityClient} from '@sanity/client'
import {type TransactionLogEventWithEffects} from '@sanity/types'
import {BehaviorSubject, from, type Observable, of} from 'rxjs'
import {catchError, map, scan, shareReplay, startWith, switchMap, tap} from 'rxjs/operators'

import {type DocumentVariantType, getDocumentVariantType} from '../../util/getDocumentVariantType'
import {getDocumentTransactions} from './getDocumentTransactions'
import {isEditTransaction} from './getEditEvents'
import {
  type DocumentGroupEvent,
  type EventsObservableValue,
  INITIAL_EVENTS_VALUE,
  isCreateDocumentVersionEvent,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
} from './types'
import {addEventId, removeDupes} from './utils'

export const HISTORY_CLEARED_EVENT_ID = 'history-cleared'

interface InitialFetchEventsOptions {
  client: SanityClient
  documentId: string
}

type FetchOrigin = 'loadMore' | 'reload' | 'initial'

/**
 * The accumulated state of the events fetches: the API events, plus the translog transactions
 * the edit events are synthesized from (see `createEventsObservable`).
 */
export interface FetchedEventsValue extends EventsObservableValue {
  /**
   * The transactions fetched to synthesize edit events, one batch per initial fetch or reload,
   * oldest first. A batch is opened when its fetch starts, and stays empty if the fetch fails.
   */
  transactionBatches: TransactionLogEventWithEffects[][]
  /** Whether a fetch found edits in the translog but no events in the events API. */
  historyCleared: boolean
}

/** What a single fetch emits, before {@link accumulateEvents} merges it into the state. */
export interface FetchEventsResult extends EventsObservableValue {
  transactions: TransactionLogEventWithEffects[]
  historyCleared: boolean
  origin: FetchOrigin
}

const INITIAL_FETCHED_EVENTS_VALUE: FetchedEventsValue = {
  ...INITIAL_EVENTS_VALUE,
  transactionBatches: [],
  historyCleared: false,
}

/**
 * Finds the revision edit events should be synthesized from (the "baseline") in a fetched
 * events batch:
 * - version documents: the creation event (versions are created once and edited until publish).
 * - draft (and other) variants: the newest revision-bearing event that isn't a delete.
 *
 * Returns the baseline `versionRevisionId`, or `undefined` when the batch has none (e.g. a
 * reload's 10-event window misses it, or history was cleared) — callers fall back to `''`,
 * which walks the entire translog (known issue).
 */
export function findEditEventsBaseline(
  events: DocumentGroupEvent[],
  documentVariantType: DocumentVariantType,
): string | undefined {
  const eventWithRevision =
    documentVariantType === 'version'
      ? events.find(isCreateDocumentVersionEvent)
      : events.find(
          (event) =>
            'versionRevisionId' in event &&
            event.versionRevisionId &&
            !isDeleteDocumentVersionEvent(event) &&
            !isDeleteDocumentGroupEvent(event),
        )

  return eventWithRevision && 'versionRevisionId' in eventWithRevision
    ? eventWithRevision.versionRevisionId
    : undefined
}

/**
 * Initial fetches and reloads open a transaction batch when they start (the `loading` emission)
 * and fill it with their transactions when they resolve. Reloads start when the viewed variant is
 * created, deleted or published, so each batch holds the transactions of one stretch of the
 * document's lifecycle. `loadMore` fetches don't synthesize edit events and leave the batches alone.
 */
function accumulateTransactionBatches(
  batches: TransactionLogEventWithEffects[][],
  next: FetchEventsResult,
): TransactionLogEventWithEffects[][] {
  if (next.origin === 'loadMore') return batches
  if (next.loading) return [...batches, []]
  if (next.error) return batches
  return [...batches.slice(0, -1), next.transactions]
}

/**
 * `scan` reducer accumulating fetch responses into the events state:
 * - New batches merge into the previous list via {@link removeDupes} (existing events are kept).
 * - Reloads keep the previous `nextCursor`; initial/loadMore fetches take the response cursor —
 *   a failed non-reload fetch therefore resets the cursor, disabling further pagination
 *   (known issue).
 * - Fetched transactions accumulate in `transactionBatches` (see
 *   {@link accumulateTransactionBatches}), and `historyCleared` stays set once a fetch set it.
 */
export function accumulateEvents(
  prev: FetchedEventsValue,
  next: FetchEventsResult,
): FetchedEventsValue {
  return {
    events: removeDupes(prev.events, next.events),
    // If we are reloading, we should keep the cursor as it was before.
    nextCursor: next.origin === 'reload' ? prev.nextCursor : next.nextCursor,
    loading: next.loading,
    error: next.error,
    transactionBatches: accumulateTransactionBatches(prev.transactionBatches, next),
    historyCleared: prev.historyCleared || next.historyCleared,
  }
}

/**
 * Creates the events-fetching pipeline for a document: an `events$` observable plus `loadMore` /
 * `reloadEvents` triggers, all driven by a single refetch subject.
 *
 * Fetching:
 * - Events come from `/data/history/<dataset>/events/documents/<id>` with `limit` 100 for
 *   initial/loadMore fetches and 10 for reloads; each event gets a client-side id via `addEventId`.
 * - For draft/version variants (not published, not loadMore), the transactions edit events are
 *   synthesized from are fetched along with the batch: the "baseline" event is the creation event
 *   (version) or the newest revision-bearing non-delete event (draft), and transactions from that
 *   revision to the present are fetched. Known quirk: when the batch has no baseline (e.g.
 *   reload's 10-event window misses it, or history was cleared), transactions are fetched with
 *   `fromTransaction: ''` — the entire translog (tracked as a known issue).
 * - `historyCleared` is set when the API returns no events but the fetched transactions contain
 *   edits.
 *
 * The edit events themselves are built by `createEventsObservable`, together with the remote
 * transactions, so fetched and live edits are grouped the same way.
 *
 * Accumulation (`scan`, see {@link accumulateEvents}):
 * - New batches merge into the previous list via `removeDupes` (existing events are kept).
 * - Reloads keep the previous `nextCursor`; initial/loadMore fetches take the response cursor.
 * - Errors are logged, emitted on `error`, and keep previously accumulated events (but reset the
 *   emitted cursor for non-reload origins, which disables further pagination — known issue).
 *
 * `loadMore` is a no-op unless a cursor exists and differs from the last cursor requested.
 */
export function getInitialFetchEvents({client, documentId}: InitialFetchEventsOptions) {
  const documentVariantType = getDocumentVariantType(documentId)
  const refetchEventsTrigger$ = new BehaviorSubject<{
    cursor: string | null
    origin: FetchOrigin
  }>({
    cursor: null,
    origin: 'initial',
  })

  const fetchEvents = ({limit, nextCursor}: {limit: number; nextCursor: string | null}) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
    })
    if (nextCursor) {
      params.append('nextCursor', nextCursor)
    }
    return client.observable
      .request<{
        events: Record<string, Omit<DocumentGroupEvent, 'id'>[]>
        nextCursor: string
      }>({
        url: `/data/history/${client.config().dataset}/events/documents/${documentId}?${params.toString()}`,
        tag: 'get-document-events',
      })
      .pipe(
        map((response) => {
          return {
            events:
              response.events[documentId]?.map((ev) => addEventId(ev, documentVariantType)) || [],
            nextCursor: response.nextCursor,
            loading: false,
            error: null,
          }
        }),
      )
  }

  const fetchEditTransactions = (events: DocumentGroupEvent[]) => {
    const baselineRevisionId = findEditEventsBaseline(events, documentVariantType)
    return from(
      getDocumentTransactions({
        client,
        documentId,
        fromTransaction: baselineRevisionId || '',
        toTransaction: undefined, // We need to get up to the present moment
      }),
    )
  }
  let nextCursor: string = ''

  return {
    events$: refetchEventsTrigger$.pipe(
      switchMap(({cursor, origin}) => {
        return fetchEvents({
          nextCursor: cursor,
          limit: origin === 'reload' ? 10 : 100,
        }).pipe(
          switchMap((response): Observable<FetchEventsResult> => {
            if (documentVariantType === 'published' || origin === 'loadMore') {
              // For the published document we don't need to fetch the edit transactions.
              return of({...response, transactions: [], historyCleared: false, origin})
            }
            return fetchEditTransactions(response.events).pipe(
              map((transactions) => ({
                ...response,
                transactions,
                historyCleared:
                  response.events.length === 0 &&
                  transactions.some((transaction) => isEditTransaction(transaction, documentId)),
                origin,
              })),
            )
          }),
          catchError((error: Error) => {
            console.error('Error fetching events', error)
            return of<FetchEventsResult>({
              events: [],
              transactions: [],
              historyCleared: false,
              nextCursor: '',
              loading: false,
              error: error,
              origin,
            })
          }),
          startWith<FetchEventsResult>({
            events: [],
            transactions: [],
            historyCleared: false,
            nextCursor: '',
            loading: true,
            error: null,
            origin,
          }),
        )
      }),
      scan(accumulateEvents, INITIAL_FETCHED_EVENTS_VALUE),
      tap((response) => {
        nextCursor = response.nextCursor
      }),
      shareReplay(1),
    ),
    /**
     * Loads new events for the document, fetching the latest events from the API.
     */
    reloadEvents: () => refetchEventsTrigger$.next({cursor: null, origin: 'reload'}),
    /**
     * Loads more events for the document, fetching the next batch of events from the API.
     */
    loadMore: () => {
      const lastCursorUsed = refetchEventsTrigger$.getValue().cursor
      if (nextCursor && lastCursorUsed !== nextCursor) {
        refetchEventsTrigger$.next({origin: 'loadMore', cursor: nextCursor})
      }
    },
  }
}
