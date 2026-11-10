import {type ReconnectEvent} from '@sanity/client'
import {
  defer,
  finalize,
  merge,
  type OperatorFunction,
  retry,
  Subject,
  tap,
  throwError,
  timer,
} from 'rxjs'

import {isTransientListenerError} from './listenerErrors'

/** @internal */
export interface ReconnectListenerOptions {
  /** Delay ceiling of the first reconnect attempt, doubled for every attempt after it. */
  baseDelayMs?: number
  /** Upper bound of the delay ceiling. */
  maxDelayMs?: number
  /** Source of the jitter, a number in `[0, 1)`. */
  random?: () => number
}

const RECONNECT: ReconnectEvent = {type: 'reconnect'}

// The events the API opens a connection with. `reset` replaces `welcome` when the listener asked to
// resume from a position the API no longer has.
const CONNECTED_EVENT_TYPES = new Set(['welcome', 'welcomeback', 'reset'])

/**
 * The delay before reconnect attempt `attempt` (0 for the first): exponential with "equal jitter",
 * a random point in the upper half of the ceiling, so that clients that lost their connections at
 * the same moment do not reconnect at the same moment.
 *
 * @internal
 */
export function reconnectDelay(
  attempt: number,
  {baseDelayMs = 1_000, maxDelayMs = 30_000, random = Math.random}: ReconnectListenerOptions = {},
): number {
  const ceiling = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
  return ceiling / 2 + (random() * ceiling) / 2
}

/**
 * Keeps a listener (`client.listen()`) alive through transient failures (see
 * `isTransientListenerError`), so they never reach the consumer as an error:
 *
 * - the listener is re-subscribed with exponential backoff for as long as it has subscribers, and
 *   the backoff starts over once a connection is open again (`welcome`, `welcomeback`, `reset`)
 * - a `reconnect` event is emitted when an outage starts, which is what the consumers already
 *   react to when the client reconnects on its own: the document form turns read-only, document
 *   lists mark themselves as not live. A `reconnect` the listener emitted itself starts the outage
 *   too, so an outage never emits more than one.
 *
 * Any other error is passed on. Place the operator right after `client.listen()`, before the
 * listener is shared, so that a single recovery serves every subscriber.
 *
 * @internal
 */
export function reconnectListener<T extends {type: string}>(
  options: ReconnectListenerOptions = {},
): OperatorFunction<T, T | ReconnectEvent> {
  return (listener$) =>
    defer(() => {
      let attempt = 0
      let reconnecting = false
      const outageStarts = new Subject<ReconnectEvent>()

      const events$ = listener$.pipe(
        tap((event) => {
          if (CONNECTED_EVENT_TYPES.has(event.type)) {
            attempt = 0
            reconnecting = false
          } else if (event.type === 'reconnect') {
            reconnecting = true
          }
        }),
        retry({
          delay: (error) => {
            if (!isTransientListenerError(error)) {
              return throwError(() => error)
            }
            if (!reconnecting) {
              reconnecting = true
              outageStarts.next(RECONNECT)
            }
            const delayMs = reconnectDelay(attempt, options)
            attempt += 1
            return timer(delayMs)
          },
        }),
        finalize(() => outageStarts.complete()),
      )

      return merge(outageStarts, events$)
    })
}
