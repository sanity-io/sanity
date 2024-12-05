import {BehaviorSubject, type Observable, of} from 'rxjs'
import {map, scan, shareReplay, startWith, switchMap, tap} from 'rxjs/operators'
import {type SanityClient} from 'sanity'

import {type ReleaseEvent} from './types'

export interface ReleaseEventsObservableValue {
  events: ReleaseEvent[]
  nextCursor: string
  loading: boolean
  error: null | Error
}
export const RELEASE_ACTIVITY_INITIAL_VALUE: ReleaseEventsObservableValue = {
  events: [],
  nextCursor: '',
  loading: true,
  error: null,
}

interface InitialFetchEventsOptions {
  client: SanityClient
  releaseId?: string
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

function addId(event: Omit<ReleaseEvent, 'id'>): ReleaseEvent {
  return {...event, id: `${event.timestamp}-${event.type}`} as ReleaseEvent
}

export function getReleaseActivityEvents({client, releaseId}: InitialFetchEventsOptions): {
  events$: Observable<ReleaseEventsObservableValue>
  reloadEvents: () => void
  loadMore: () => void
} {
  if (!releaseId) {
    return {events$: of(RELEASE_ACTIVITY_INITIAL_VALUE), reloadEvents: () => {}, loadMore: () => {}}
  }
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
        events: Omit<ReleaseEvent, 'id'>[]
        nextCursor: string
      }>({
        url: `/data/events/${client.config().dataset}/releases/${releaseId}?${params.toString()}`,
        tag: 'get-release-events',
      })
      .pipe(
        map((response) => {
          return {
            events: response.events.map(addId),
            nextCursor: response.nextCursor,
            loading: false,
            error: null,
          }
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
      }, RELEASE_ACTIVITY_INITIAL_VALUE),
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
