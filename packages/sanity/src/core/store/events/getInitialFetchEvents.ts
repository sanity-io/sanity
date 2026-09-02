import {type SanityClient} from '@sanity/client'
import {BehaviorSubject, from, of} from 'rxjs'
import {catchError, map, scan, shareReplay, startWith, switchMap, tap} from 'rxjs/operators'

import {getDocumentVariantType} from '../../util/getDocumentVariantType'
import {getDocumentTransactions} from './getDocumentTransactions'
import {getEditEvents} from './getEditEvents'
import {
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  type HistoryClearedEvent,
  isCreateDocumentVersionEvent,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
} from './types'
import {addEventId, removeDupes} from './utils'

export const HISTORY_CLEARED_EVENT_ID = 'history-cleared'
export interface EventsObservableValue {
  events: DocumentGroupEvent[]
  nextCursor: string
  loading: boolean
  error: null | Error
}
const INITIAL_VALUE: EventsObservableValue = {
  events: [],
  nextCursor: '',
  loading: true,
  error: null,
}

interface InitialFetchEventsOptions {
  client: SanityClient
  documentId: string
}

/**
 * Creates the events-fetching pipeline for a document: an `events$` observable plus `loadMore` /
 * `reloadEvents` triggers, all driven by a single refetch subject.
 *
 * Fetching:
 * - Events come from `/data/history/<dataset>/events/documents/<id>` with `limit` 100 for
 *   initial/loadMore fetches and 10 for reloads; each event gets a client-side id via `addEventId`.
 * - For draft/version variants (not published, not loadMore), edit events are synthesized for the
 *   fetched batch: the "baseline" event is the creation event (version) or the newest
 *   revision-bearing non-delete event (draft), and transactions from that revision to the present
 *   are fetched and mapped through `getEditEvents`. Known quirk: when the batch has no baseline
 *   (e.g. reload's 10-event window misses it, or history was cleared), transactions are fetched
 *   with `fromTransaction: ''` — the entire translog (tracked as a known issue).
 * - A synthetic `historyCleared` event (id `history-cleared`, timestamped 1ms before the oldest
 *   edit event) is prepended when the API returns no events but edit transactions exist.
 *
 * Accumulation (`scan`):
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
    origin: 'loadMore' | 'reload' | 'initial'
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

  const fetchEditEvents = (events: DocumentGroupEvent[]) => {
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

    const revisionId =
      eventWithRevision &&
      'versionRevisionId' in eventWithRevision &&
      eventWithRevision.versionRevisionId
    return from(
      getDocumentTransactions({
        client,
        documentId,
        fromTransaction: revisionId || '',
        toTransaction: undefined, // We need to get up to the present moment
      }),
    ).pipe(
      map((transactions) => {
        const editEvents: (EditDocumentVersionEvent | HistoryClearedEvent)[] = getEditEvents(
          transactions,
          documentId,
          false,
        )
        const needsHistoryClearedEvent =
          events.length === 0 && transactions.length > 0 && editEvents.length > 0
        if (needsHistoryClearedEvent) {
          const clearedEventTimestamp =
            new Date(editEvents[editEvents.length - 1].timestamp).getTime() - 1

          editEvents.unshift({
            type: 'historyCleared',
            documentId,
            id: HISTORY_CLEARED_EVENT_ID,
            timestamp: new Date(clearedEventTimestamp).toISOString(),
            author: '',
            documentVariantType,
          })
        }
        return editEvents
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
          switchMap((response) => {
            if (documentVariantType === 'published' || origin === 'loadMore') {
              // For the published document we don't need to fetch the edit transactions.
              return of({...response, origin})
            }
            return fetchEditEvents(response.events).pipe(
              map((editEvents) => {
                return {...response, events: [...editEvents, ...response.events], origin}
              }),
            )
          }),
          catchError((error: Error) => {
            console.error('Error fetching events', error)
            return [{events: [], nextCursor: '', loading: false, error: error, origin}]
          }),
          startWith({events: [], nextCursor: '', loading: true, error: null, origin}),
        )
      }),
      scan((prev, next) => {
        return {
          events: removeDupes(prev.events, next.events),
          // If we are reloading, we should keep the cursor as it was before.
          nextCursor: next.origin === 'reload' ? prev.nextCursor : next.nextCursor,
          loading: next.loading,
          error: next.error,
        }
      }, INITIAL_VALUE),
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
