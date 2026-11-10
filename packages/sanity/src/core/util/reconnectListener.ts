import {type ReconnectEvent} from '@sanity/client'
import {
  defer,
  filter,
  finalize,
  ignoreElements,
  merge,
  type OperatorFunction,
  retry,
  Subject,
  takeUntil,
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
  /**
   * How many `reconnect` events the listener may emit without opening a connection before its
   * connection is replaced by one opened with backoff.
   */
  maxClientReconnects?: number
  /** How long a connection may take to open before an outage starts. */
  welcomeTimeoutMs?: number
}

/**
 * Raised when the client keeps failing to reconnect on its own, to hand the reconnect over to the
 * backoff.
 */
class ClientReconnectsExceededError extends Error {
  constructor() {
    super('The listener failed to reconnect')
    this.name = 'ClientReconnectsExceededError'
  }
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
 * - the client retries a failed listen request on its own, at a fixed interval and for as long as
 *   it keeps failing (every 3s after a network failure, every 1s after a 5xx), emitting a
 *   `reconnect` for each attempt. Once it has emitted `maxClientReconnects` of them without
 *   opening a connection, its connection is closed and replaced by one opened with backoff, and
 *   every connection opened during the outage is replaced after its first failed attempt. A
 *   connection opened this way cannot resume from the last event, so it opens with `welcome`
 *   rather than `welcomeback`, which makes the consumers refetch.
 * - an outage also starts when a connection has not opened within `welcomeTimeoutMs`. The API
 *   answers the listen request before it sets the listener up, and sends nothing the client
 *   surfaces until `welcome`, so a listener whose setup hangs would otherwise leave the consumers
 *   waiting with no end. The connection is kept, and opening late ends the outage.
 *
 * Any other error is passed on. Place the operator right after `client.listen()`, before the
 * listener is shared, so that a single recovery serves every subscriber.
 *
 * @internal
 */
export function reconnectListener<T extends {type: string}>(
  options: ReconnectListenerOptions = {},
): OperatorFunction<T, T | ReconnectEvent> {
  const {maxClientReconnects = 2, welcomeTimeoutMs = 10_000} = options
  return (listener$) =>
    defer(() => {
      let attempt = 0
      let reconnecting = false
      const outageStarts = new Subject<ReconnectEvent>()

      function startOutage() {
        if (reconnecting) return
        reconnecting = true
        outageStarts.next(RECONNECT)
      }

      // A single connection: subscribing to it opens it, and the retry below opens a new one.
      const connection$ = defer(() => {
        let opened = false
        let clientReconnects = 0
        const connectionEnds = new Subject<void>()

        const events$ = listener$.pipe(
          filter((event) => {
            if (CONNECTED_EVENT_TYPES.has(event.type)) {
              opened = true
              attempt = 0
              reconnecting = false
              clientReconnects = 0
            } else if (event.type === 'reconnect') {
              const announced = reconnecting
              reconnecting = true
              clientReconnects += 1
              // A connection opened with backoff is replaced as soon as it fails.
              if (clientReconnects >= (attempt === 0 ? maxClientReconnects : 1)) {
                throw new ClientReconnectsExceededError()
              }
              // The outage has been announced already (the welcome timeout, an earlier attempt).
              return !announced
            }
            return true
          }),
          finalize(() => connectionEnds.next()),
        )

        const welcomeTimeout$ = timer(welcomeTimeoutMs).pipe(
          // A listener that ends is passed on as it ends, without waiting for the timeout.
          takeUntil(connectionEnds),
          filter(() => !opened),
          tap(startOutage),
          ignoreElements(),
        )

        // The timeout is subscribed first, so it also learns of a listener that ends as soon as it
        // is subscribed.
        return merge(welcomeTimeout$, events$)
      })

      const events$ = connection$.pipe(
        retry({
          delay: (error) => {
            if (
              !(error instanceof ClientReconnectsExceededError) &&
              !isTransientListenerError(error)
            ) {
              return throwError(() => error)
            }
            startOutage()
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
