import {type LiveEvent, type LiveEventMessage, type SyncTag} from '@sanity/client'
import {fetchSharedAccessQuery} from '@sanity/preview-url-secret/constants'
import {
  BehaviorSubject,
  combineLatest,
  concat,
  defer,
  distinctUntilChanged,
  interval,
  map,
  mergeMap,
  of,
  scan,
  startWith,
  switchMap,
  takeWhile,
  tap,
} from 'rxjs'
import {type SanityClient} from 'sanity'
import {fromObservable, type ObservableActorLogic} from 'xstate'

/**
 * Only the most recent live events can be about the shared secret, the same cap `useLiveEvents` uses
 */
const MAX_BUFFERED_MESSAGES = 100
const POLL_INTERVAL_AFTER_GOAWAY = 30_000

type SharedSecretEvent = LiveEvent | {type: 'poll'}

interface LiveEventsState {
  messages: LiveEventMessage[]
  /**
   * Counts the events after which changes might have been missed, and the shared secret is read from scratch
   */
  resets: number
}

const initialLiveEventsState: LiveEventsState = {messages: [], resets: 0}

function reduceLiveEvents(state: LiveEventsState, event: SharedSecretEvent): LiveEventsState {
  switch (event.type) {
    case 'message':
      return {...state, messages: [...state.messages, event].slice(-MAX_BUFFERED_MESSAGES)}
    case 'restart':
    case 'reconnect':
    case 'goaway':
    case 'poll':
      /**
       * The ids of earlier events don't apply to what follows, so they're dropped
       */
      return {messages: [], resets: state.resets + 1}
    case 'welcome':
      return state
    default:
      event satisfies never
      return state
  }
}

/**
 * Emits the shared preview secret, or `null` while sharing is off, and again whenever that changes
 * @internal
 */
export function defineWatchSharedSecretActor({
  client,
}: {
  client: SanityClient
}): ObservableActorLogic<string | null, void> {
  return fromObservable(() =>
    defer(() => {
      /**
       * `undefined` until the first read, so live events that arrive while it's in flight are matched once it's done
       */
      const syncTags$ = new BehaviorSubject<SyncTag[] | undefined>(undefined)
      /**
       * A `goaway` means the live events connection was rejected or closed, for example because of connection
       * limits, and the Live Content API expects clients to poll from then on
       */
      const events$ = concat(
        client.live.events().pipe(takeWhile((event) => event.type !== 'goaway', true)),
        interval(POLL_INTERVAL_AFTER_GOAWAY).pipe(map((): SharedSecretEvent => ({type: 'poll'}))),
      )

      return combineLatest([
        events$.pipe(
          scan(reduceLiveEvents, initialLiveEventsState),
          startWith(initialLiveEventsState),
        ),
        syncTags$,
      ]).pipe(
        map(([{messages, resets}, syncTags]) => ({
          resets,
          lastLiveEventId: messages.findLast((message) =>
            message.tags.some((tag) => syncTags?.includes(tag)),
          )?.id,
        })),
        /**
         * Reads it once for every reset, from scratch, and once for every live event about it
         */
        distinctUntilChanged(
          (previous, next) =>
            previous.resets === next.resets && previous.lastLiveEventId === next.lastLiveEventId,
        ),
        switchMap(({lastLiveEventId}) =>
          client.observable.fetch<string | null>(
            fetchSharedAccessQuery,
            {},
            {
              filterResponse: false,
              lastLiveEventId,
              tag: 'presentation.watch-shared-access-secret',
            },
          ),
        ),
        /**
         * The sync tags are updated after the result is emitted, as a live event they match starts the next read
         */
        mergeMap((response) =>
          of(response.result).pipe(tap({complete: () => syncTags$.next(response.syncTags ?? [])})),
        ),
        distinctUntilChanged(),
      )
    }),
  )
}
