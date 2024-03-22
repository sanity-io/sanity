import {
  type ListenerMutationEvent,
  type ListenerSyncEvent,
  type SanityMutation,
} from '@bjoerge/mutiny/_unstable_store'
import {type MutationEvent, type SanityClient, type WelcomeEvent} from '@sanity/client'
import {type SanityDocumentBase} from '@sanity/mutate'
import {type SanityDocumentLike} from '@sanity/types'
import {
  defer,
  merge,
  mergeMap,
  type MonoTypeOperatorFunction,
  type Observable,
  ReplaySubject,
  share,
  timer,
} from 'rxjs'
import {filter, map} from 'rxjs/operators'

export function createDatasetListener(client: SanityClient) {
  let _globalListener: {
    welcome$: Observable<any>
    mutations$: Observable<MutationEvent<SanityDocumentLike>>
  } | null = null

  function shareReplayDelayedDisconnect<T>(delay: number): MonoTypeOperatorFunction<T> {
    return share<T>({
      connector: () => new ReplaySubject(1, Infinity),
      resetOnError: true,
      resetOnComplete: true,
      resetOnRefCountZero: () => timer(delay),
    })
  }

  const getGlobalEvents = () => {
    if (!_globalListener) {
      const allEvents$ = defer(() =>
        client.listen(
          '*[!(_id in path("_.**"))]',
          {},
          {
            events: ['welcome', 'mutation'],
            includeResult: false,
            visibility: 'query',
            effectFormat: 'mendoza',
          },
        ),
      ).pipe(shareReplayDelayedDisconnect(1000))

      // This is a stream of welcome events from the server, each telling us that we have established listener connection
      // We map these to snapshot fetch/sync. It is good to wait for the first welcome event before fetching any snapshots as, we may miss
      // events that happens in the time period after initial fetch and before the listener is established.
      const welcome$ = allEvents$.pipe(
        filter((event): event is WelcomeEvent => event.type === 'welcome'),
        shareReplayDelayedDisconnect(1000),
      )

      const mutations$ = allEvents$.pipe(
        filter((event): event is MutationEvent => event.type === 'mutation'),
      )

      _globalListener = {
        welcome$,
        mutations$,
      }
    }

    return _globalListener
  }

  function listenDocumentId(id: string) {
    const globalEvents = getGlobalEvents()
    return merge(
      globalEvents.welcome$.pipe(
        mergeMap(() => client.getDocument(id)),
        map(
          (doc: undefined | SanityDocumentBase): ListenerSyncEvent => ({
            type: 'sync',
            transactionId: doc?._id,
            document: doc,
          }),
        ),
      ),
      globalEvents.mutations$.pipe(
        filter(
          (event): event is MutationEvent => event.type === 'mutation' && event.documentId === id,
        ),
        map(
          (event): ListenerMutationEvent => ({
            type: 'mutation',
            transactionId: event.transactionId,
            effects: event.effects!.apply,
            mutations: event.mutations as SanityMutation[],
          }),
        ),
      ),
    )
  }
  return listenDocumentId
}
