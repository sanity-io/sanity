import {type ReconnectEvent} from '@sanity/client'
import {
  catchError,
  concat,
  defer,
  EMPTY,
  mergeMap,
  type MonoTypeOperatorFunction,
  of,
  type OperatorFunction,
  retry,
  scan,
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

// The events that tell a connection is open. A new listener opens with `welcome`, and one resuming
// from a position (`enableResume`) with `welcomeback`. The API then replays what the listener
// missed, and when it cannot finish the replay, it sends `reset` before live events resume:
// at any point after `welcomeback`, on the same connection. `reset` still counts in case
// `welcomeback` never arrived.
const CONNECTED_EVENT_TYPES = new Set(['welcome', 'welcomeback', 'reset'])

function isConnected(event: {type: string}): boolean {
  return CONNECTED_EVENT_TYPES.has(event.type)
}

/**
 * Passes a `reconnect` on only when it starts an outage. An outage lasts until a connection opens,
 * so however many times it is reported, the consumers see a single `reconnect`.
 */
function announceEachOutageOnce<E extends {type: string}>(): MonoTypeOperatorFunction<E> {
  return (events$) =>
    events$.pipe(
      scan<E, {down: boolean; passed: E | null}>(
        ({down}, event) => ({
          down: event.type === 'reconnect' || (down && !isConnected(event)),
          passed: event.type === 'reconnect' && down ? null : event,
        }),
        {down: false, passed: null},
      ),
      mergeMap(({passed}) => (passed ? [passed] : [])),
    )
}

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
      // Failed attempts since a connection last opened, which sets the backoff.
      let attempt = 0

      return listener$.pipe(
        // A failure the backoff recovers from starts an outage before the next attempt.
        catchError((error) =>
          concat(
            isTransientListenerError(error) ? of(RECONNECT) : EMPTY,
            throwError(() => error),
          ),
        ),
        retry({
          delay: (error) => {
            if (!isTransientListenerError(error)) return throwError(() => error)
            const delayMs = reconnectDelay(attempt, options)
            attempt += 1
            return timer(delayMs)
          },
        }),
        tap((event) => {
          if (isConnected(event)) attempt = 0
        }),
        announceEachOutageOnce(),
      )
    })
}
