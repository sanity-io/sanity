import {type ReconnectEvent} from '@sanity/client'
import {
  catchError,
  concat,
  connect,
  defer,
  EMPTY,
  filter,
  first,
  map,
  merge,
  mergeMap,
  type MonoTypeOperatorFunction,
  type Observable,
  of,
  type OperatorFunction,
  retry,
  scan,
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

// The events that tell a connection is open. A new listener opens with `welcome`, and one resuming
// from a position (`enableResume`) with `welcomeback`. The API then replays what the listener
// missed, and when it cannot finish the replay, it sends `reset` before live events resume:
// at any point after `welcomeback`, on the same connection. `reset` still counts in case
// `welcomeback` never arrived.
const CONNECTED_EVENT_TYPES = new Set(['welcome', 'welcomeback', 'reset'])

function isConnected(event: {type: string}): boolean {
  return CONNECTED_EVENT_TYPES.has(event.type)
}

function isRecoverable(error: unknown): boolean {
  return error instanceof ClientReconnectsExceededError || isTransientListenerError(error)
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
 * Fails a connection once the client has failed to reconnect on its own `maxClientReconnects`
 * times without opening it. A connection opened with backoff fails after the first, until it opens.
 */
function clientReconnectsExceeded(
  events$: Observable<{type: string}>,
  maxClientReconnects: number,
  openedWithBackoff: boolean,
): Observable<never> {
  return events$.pipe(
    scan(
      ({limit, count}, event) => {
        if (isConnected(event)) return {limit: maxClientReconnects, count: 0}
        return {limit, count: event.type === 'reconnect' ? count + 1 : count}
      },
      {limit: openedWithBackoff ? 1 : maxClientReconnects, count: 0},
    ),
    filter(({limit, count}) => count >= limit),
    mergeMap(() => throwError(() => new ClientReconnectsExceededError())),
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
  return (listener$) => {
    // A single connection: subscribing to it opens it. `connect` subscribes every branch before
    // the listener, so they all see the events of a listener that emits as soon as it is
    // subscribed, and in this order.
    function openConnection(openedWithBackoff: boolean): Observable<T | ReconnectEvent> {
      return listener$.pipe(
        connect((events$) =>
          merge(
            // Starts an outage when the connection has not opened in time. The connection is kept,
            // and opening late ends the outage.
            timer(welcomeTimeoutMs).pipe(
              // Emits as the connection opens, or ends without opening.
              takeUntil(events$.pipe(first(isConnected, null))),
              map(() => RECONNECT),
            ),
            clientReconnectsExceeded(events$, maxClientReconnects, openedWithBackoff),
            events$,
          ),
        ),
      )
    }

    return defer(() => {
      // Failed attempts since a connection last opened, which sets the backoff.
      let attempt = 0

      return defer(() => openConnection(attempt > 0)).pipe(
        // A failure the backoff recovers from starts an outage before the next attempt.
        catchError((error) =>
          concat(
            isRecoverable(error) ? of(RECONNECT) : EMPTY,
            throwError(() => error),
          ),
        ),
        retry({
          delay: (error) => {
            if (!isRecoverable(error)) return throwError(() => error)
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
}
