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
        : events.find((event) => 'versionRevisionId' in event && event.versionRevisionId)

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
