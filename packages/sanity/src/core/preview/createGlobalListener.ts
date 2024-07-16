import {type MutationEvent, type SanityClient, type WelcomeEvent} from '@sanity/client'
import {defer, merge, timer} from 'rxjs'
import {filter, share, shareReplay} from 'rxjs/operators'

/**
 * @internal
 * Creates a listener that will emit 'welcome' for all new subscribers immediately, and thereafter emit at every mutation event
 */
export function createGlobalListener(client: SanityClient) {
  const allEvents$ = defer(() =>
    client.listen(
      '*[!(_id in path("_.**"))]',
      {},
      {
        events: ['welcome', 'mutation'],
        includeResult: false,
        includePreviousRevision: false,
        visibility: 'transaction',
        effectFormat: 'mendoza',
        tag: 'preview.global',
      },
    ),
  ).pipe(
    filter(
      (event): event is WelcomeEvent | MutationEvent =>
        event.type === 'welcome' || event.type === 'mutation',
    ),
    share({resetOnRefCountZero: () => timer(2000), resetOnComplete: true}),
  )

  const welcome$ = allEvents$.pipe(
    filter((event) => event.type === 'welcome'),
    shareReplay({refCount: true, bufferSize: 1}),
  )
  const mutations$ = allEvents$.pipe(filter((event) => event.type === 'mutation')).pipe(share())
  return merge(welcome$, mutations$)
}
