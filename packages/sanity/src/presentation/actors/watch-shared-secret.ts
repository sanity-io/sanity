import {type SyncTag} from '@sanity/client'
import {fetchSharedAccessQuery} from '@sanity/preview-url-secret/constants'
import {defer, distinctUntilChanged, filter, map, startWith, switchMap, tap} from 'rxjs'
import {type SanityClient} from 'sanity'
import {fromObservable, type ObservableActorLogic} from 'xstate'

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
      let syncTags: SyncTag[] = []

      return client.live.events().pipe(
        filter(
          (event) =>
            event.type === 'restart' ||
            event.type === 'reconnect' ||
            (event.type === 'message' && event.tags.some((tag) => syncTags.includes(tag))),
        ),
        map((event) => (event.type === 'message' ? event.id : undefined)),
        startWith(undefined),
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
        tap((response) => {
          syncTags = response.syncTags ?? []
        }),
        map((response) => response.result),
        distinctUntilChanged(),
      )
    }),
  )
}
