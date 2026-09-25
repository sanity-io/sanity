import {type LiveEventMessage, type SyncTag} from '@sanity/client'
import {fetchSharedAccessQuery} from '@sanity/preview-url-secret/constants'
import {
  BehaviorSubject,
  combineLatest,
  defer,
  distinctUntilChanged,
  filter,
  map,
  merge,
  mergeMap,
  of,
  scan,
  share,
  startWith,
  switchMap,
  tap,
} from 'rxjs'
import {type SanityClient} from 'sanity'
import {fromObservable, type ObservableActorLogic} from 'xstate'

/**
 * Only the most recent live events can be about the shared secret, the same cap `useLiveEvents` uses
 */
const MAX_BUFFERED_MESSAGES = 100

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
      const events$ = client.live.events().pipe(share())
      /**
       * `undefined` until the first read, so live events that arrive while it's in flight are matched once it's done
       */
      const syncTags$ = new BehaviorSubject<SyncTag[] | undefined>(undefined)

      const lastMessageId$ = combineLatest([
        events$.pipe(
          filter((event): event is LiveEventMessage => event.type === 'message'),
          scan<LiveEventMessage, LiveEventMessage[]>(
            (messages, message) => [...messages, message].slice(-MAX_BUFFERED_MESSAGES),
            [],
          ),
          startWith([]),
        ),
        syncTags$,
      ]).pipe(
        map(
          ([messages, syncTags]) =>
            messages.findLast((message) => message.tags.some((tag) => syncTags?.includes(tag)))?.id,
        ),
        distinctUntilChanged(),
      )
      /**
       * Changes might have been missed, so read it again from scratch
       */
      const resets$ = events$.pipe(
        filter((event) => event.type === 'restart' || event.type === 'reconnect'),
        map(() => undefined),
      )

      return merge(lastMessageId$, resets$).pipe(
        switchMap((lastLiveEventId) =>
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
