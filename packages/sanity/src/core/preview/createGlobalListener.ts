import {
  type MutationEvent,
  type ReconnectEvent,
  type SanityClient,
  type WelcomeEvent,
} from '@sanity/client'
import {merge, timer} from 'rxjs'
import {filter, share, shareReplay} from 'rxjs/operators'

/**
 * @internal
 * Creates a listener that will emit 'welcome' for all new subscribers immediately, and thereafter emit at every mutation event
 */
export function createGlobalListener(client: SanityClient) {
  const allEvents$ = client
    .listen(
      '*[!(_id in path("_.**"))]',
      {},
      {
        events: ['welcome', 'mutation', 'reconnect'],
        includeResult: false,
        includePreviousRevision: false,
        includeMutations: false,
        visibility: 'transaction',
        effectFormat: 'mendoza',
        tag: 'preview.global',
      },
    )
    .pipe(
      share({
        resetOnRefCountZero: () => timer(2000),
      }),
    )

  // Reconnect events emitted in case the connection is lost
  const reconnect = allEvents$.pipe(
    filter((event): event is ReconnectEvent => event.type === 'reconnect'),
  )

  // Welcome events are emitted when the listener is (re)connected
  const welcome = allEvents$.pipe(
    filter((event): event is WelcomeEvent => event.type === 'welcome'),
  )

  // Mutation events coming from the listener
  const mutations = allEvents$.pipe(
    filter((event): event is MutationEvent => event.type === 'mutation'),
  )

  // Replay the latest connection event that was emitted either when the connection was disconnected ('reconnect'), established or re-established ('welcome')
  const connectionEvent = merge(welcome, reconnect).pipe(
    shareReplay({bufferSize: 1, refCount: true}),
  )

  // Emit the welcome event if the latest connection event was the 'welcome' event.
  // Downstream subscribers will typically map the welcome event to an initial fetch
  const replayWelcome = connectionEvent.pipe(
    filter((latestConnectionEvent) => latestConnectionEvent.type === 'welcome'),
  )

  // Combine into a single stream
  return merge(replayWelcome, mutations, reconnect)
}
