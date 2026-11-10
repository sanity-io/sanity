import {type MutationEvent, type SanityClient, type WelcomeEvent} from '@sanity/client'
import {type Observable, timer} from 'rxjs'
import {filter, map} from 'rxjs/operators'

import {LISTENER_RESET_DELAY} from '../../preview/constants'
import {type InvalidationChannelEvent} from '../../preview/types'
import {shareReplayLatest} from '../../preview/utils/shareReplayLatest'

/**
 * The Studio's shared listener on every document in the dataset. `globalListener` and
 * `invalidationChannel` are served by one connection, which opens on the first subscription and
 * closes `LISTENER_RESET_DELAY` after the last subscriber has left.
 *
 * Both start with an event that marks the listener as connected. A new subscriber gets it right
 * away while the listener stays connected, and every subscriber gets it again once the listener
 * has reconnected after losing its connection, since changes may have been missed in between.
 *
 * @internal
 */
export interface GlobalListenerStore {
  /**
   * The listener's own events: `welcome`, then a `mutation` event with its mendoza effects for
   * every change to a document in the dataset, for keeping a local copy of documents in sync.
   */
  globalListener: Observable<WelcomeEvent | MutationEvent>
  /**
   * `{type: 'connected'}`, then a mutation event for every change to a document in the dataset,
   * for refetching whatever a change may affect.
   */
  invalidationChannel: Observable<InvalidationChannelEvent>
}

/** @internal */
export interface GlobalListenerStoreOptions {
  client: SanityClient
}

/** @internal */
export function createGlobalListenerStore({
  client,
}: GlobalListenerStoreOptions): GlobalListenerStore {
  const listener = client
    .withConfig({apiVersion: '2025-02-19'})
    .listen(
      '*',
      {},
      {
        events: ['welcome', 'mutation', 'reconnect'],
        includeResult: false,
        includePreviousRevision: false,
        includeMutations: false,
        includeAllVersions: true,
        visibility: 'query',
        effectFormat: 'mendoza',
        // Predates this store: renaming it would split the listener's history in request logs
        tag: 'preview.global',
      },
    )
    .pipe(
      shareReplayLatest({
        predicate: (event) => event.type === 'welcome' || event.type === 'reconnect',
        resetOnRefCountZero: () => timer(LISTENER_RESET_DELAY),
      }),
    )

  const globalListener = listener.pipe(
    filter(
      (event): event is MutationEvent | WelcomeEvent =>
        // ignore reconnect events for now until we've verified that downstream consumers can handle them
        event.type === 'mutation' || event.type === 'welcome',
    ),
  )

  const invalidationChannel = globalListener.pipe(
    map((event) => (event.type === 'welcome' ? {type: 'connected' as const} : event)),
  )

  return {globalListener, invalidationChannel}
}
