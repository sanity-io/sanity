import {type MonoTypeOperatorFunction, timer} from 'rxjs'

import {LISTENER_RESET_DELAY} from '../../preview/constants'
import {shareReplayLatest} from '../../preview/utils/shareReplayLatest'

/**
 * Shares one listener connection between all its subscribers. The connection opens on the first
 * subscription and closes `LISTENER_RESET_DELAY` after the last subscriber has left. A subscriber
 * that arrives while the listener is connected gets its latest `welcome` right away, and one that
 * arrives while it is reconnecting gets the `reconnect`.
 *
 * @internal
 */
export function shareListenerEvents<T extends {type: string}>(): MonoTypeOperatorFunction<T> {
  return shareReplayLatest<T>({
    predicate: (event) => event.type === 'welcome' || event.type === 'reconnect',
    resetOnRefCountZero: () => timer(LISTENER_RESET_DELAY),
  })
}
