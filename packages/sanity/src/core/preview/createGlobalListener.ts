import {type SanityClient} from '@sanity/client'
import {timer} from 'rxjs'

import {LISTENER_RESET_DELAY} from './constants'
import {shareReplayLatest} from './utils/shareReplayLatest'

/**
 * @internal
 * Creates a listener that will emit 'welcome' for all new subscribers immediately, and thereafter emit at every mutation event
 */
export function createGlobalListener(client: SanityClient) {
  return client
    .listen(
      '*[!(_id in path("_.**"))]',
      {},
      {
        events: ['welcome', 'mutation', 'reconnect'],
        includeResult: false,
        includePreviousRevision: false,
        includeMutations: false,
        visibility: 'query',
        tag: 'preview.global',
      },
    )
    .pipe(
      shareReplayLatest({
        predicate: (event) => event.type === 'welcome' || event.type === 'reconnect',
        resetOnRefCountZero: () => timer(LISTENER_RESET_DELAY),
      }),
    )
}
