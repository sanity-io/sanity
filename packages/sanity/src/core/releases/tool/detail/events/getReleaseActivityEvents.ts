import {type SanityClient} from '@sanity/client'
import {BehaviorSubject, type Observable} from 'rxjs'
import {catchError, map, scan, shareReplay, startWith, switchMap, tap} from 'rxjs/operators'

import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {type ReleaseEvent} from './types'

export interface ReleaseEventsObservableValue {
  events: ReleaseEvent[]
  nextCursor: string
  loading: boolean
  error: null | Error
}
export const INITIAL_VALUE: ReleaseEventsObservableValue = {
  events: [],
  nextCursor: '',
  loading: true,
  error: null,
}

function removeDupes(prev: ReleaseEvent[], next: ReleaseEvent[]): ReleaseEvent[] {
  const noDupes = [...prev, ...next].reduce((acc, event) => {
    if (acc.has(event.id)) {
      return acc
    }
    return acc.set(event.id, event)
  }, new Map<string, ReleaseEvent>())
  return Array.from(noDupes.values())
}

export function addEventData(event: Omit<ReleaseEvent, 'id' | 'origin'>): ReleaseEvent {
  return {...event, id: `${event.timestamp}-${event.type}`, origin: 'events'} as ReleaseEvent
}

interface InitialFetchEventsOptions {
  client: SanityClient
  releaseId: string
}
export function getReleaseActivityEvents({client, releaseId}: InitialFetchEventsOptions): {
  events$: Observable<ReleaseEventsObservableValue>
  reloadEvents: () => void
  loadMore: () => void
} {
  const refetchEventsTrigger$ = new BehaviorSubject<{
    cursor: string | null
    origin: 'loadMore' | 'reload' | 'initial'
  }>({
    cursor: null,
    origin: 'initial',
  })

  const fetchEvents = ({limit, nextCursor}: {limit: number; nextCursor: string | null}) => {
    const params = new URLSearchParams({limit: limit.toString()})
    if (nextCursor) {
      params.append('nextCursor', nextCursor)
    }
    return client.observable
      .request<{
        events: Omit<ReleaseEvent, 'id' | 'origin'>[]
        nextCursor: string
      }>({
        url: `/data/history/${client.config().dataset}/events/releases/${getReleaseIdFromReleaseDocumentId(releaseId)}?${params.toString()}`,
        tag: 'get-release-events',
      })
      .pipe(
        map((response) => {
          return {
            events: response.events.map(addEventData),
            nextCursor: response.nextCursor,
            loading: false,
            error: null,
          }
        }),
        catchError((error) => {
          console.error(error)
          return [{events: [], nextCursor: '', loading: false, error}]
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
          map((response) => {
            return {...response, origin}
          }),
          startWith({events: [], nextCursor: '', loading: true, error: null, origin}),
        )
      }),
      scan((prev, next) => {
        const events = removeDupes(prev.events, next.events).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        return {
          events: events,
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
     * Loads new events for the release, fetching the latest events from the API.
     */
    reloadEvents: () => refetchEventsTrigger$.next({cursor: null, origin: 'reload'}),
    /**
     * Loads more events for the release, fetching the next batch of events from the API.
     */
    loadMore: () => {
      const lastCursorUsed = refetchEventsTrigger$.getValue().cursor
      if (nextCursor && lastCursorUsed !== nextCursor) {
        refetchEventsTrigger$.next({origin: 'loadMore', cursor: nextCursor})
      }
    },
  }
}
