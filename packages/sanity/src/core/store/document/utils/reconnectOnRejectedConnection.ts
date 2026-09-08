import {concat, defer, of, type OperatorFunction, throwError, timer} from 'rxjs'
import {catchError, retry, tap} from 'rxjs/operators'

import {debug} from '../debug'
import {type ReconnectEvent} from '../types'

const RECONNECT: ReconnectEvent = {type: 'reconnect'}

// Doubles per consecutive rejection up to the cap, so a listener that keeps
// being rejected does not hammer the API. Reset once a connection succeeds
// (a `welcome`), so an isolated blip after a long healthy stretch waits the
// base delay, not the escalated one.
const BASE_DELAY_MS = 1_000
const MAX_DELAY_MS = 30_000

/**
 * Whether `err` is a listener connection the client gave up on: an EventSource
 * connection rejected with a 4xx the client does not retry itself (anything
 * but 408/429). Network drops and 5xx never surface here — the client turns
 * those into `reconnect` events and reconnects on its own. Matched by name
 * rather than `instanceof`, so it also holds across duplicate client copies.
 */
function isRejectedConnection(err: unknown): err is Error & {status?: number} {
  return err instanceof Error && err.name === 'ConnectionFailedError'
}

/**
 * Re-establishes a listener the client gave up on, instead of letting the
 * failure error the document event streams.
 *
 * The listener does not go through the studio request handler (it is an
 * EventSource, not a request), so a rejected connection — typically a 401
 * from credentials that expired while the tab was idle — would otherwise
 * error every stream derived from the pair and take the whole tool down.
 * Instead, signal a `reconnect` so the form goes read-only like on any other
 * connection loss, and retry with backoff. A fresh connection replays
 * `welcome`, which refetches the snapshots and resyncs the pair.
 *
 * `retry` (not `catchError`'s `caught`) does the resubscription, so it stays
 * flat: `caught` nests a new subscriber chain per retry, and the retry count
 * here is unbounded (a persistent 403 loops forever at the cap), so a
 * long-lived tab would grow the chain until delivery overflows the stack —
 * the exact crash this operator exists to prevent. The backoff can't ride on
 * `retry`'s own count, though: it must reset on `welcome`, and `resetOnSuccess`
 * resets on *any* upstream value including the `reconnect` this emits (which
 * would stop the backoff ever growing). So the count is tracked explicitly and
 * reset on `welcome`, with `resetOnSuccess` left off.
 */
export function reconnectOnRejectedConnection<T extends {type: string}>(): OperatorFunction<
  T,
  T | ReconnectEvent
> {
  return (source) =>
    // `defer` so the counter is per subscription, not shared across them.
    defer(() => {
      let consecutiveRejections = 0
      return source.pipe(
        tap((event) => {
          if (event.type === 'welcome' || event.type === 'welcomeback') consecutiveRejections = 0
        }),
        // Surface the rejection as a `reconnect` event, then rethrow so `retry`
        // resubscribes after the backoff.
        catchError((err: unknown) => {
          if (!isRejectedConnection(err)) throw err
          return concat(
            of(RECONNECT),
            throwError(() => err),
          )
        }),
        retry({
          delay: (err: unknown) => {
            if (!isRejectedConnection(err)) throw err
            consecutiveRejections += 1
            const delay = Math.min(BASE_DELAY_MS * 2 ** (consecutiveRejections - 1), MAX_DELAY_MS)
            debug('Listener connection rejected (HTTP %s), reconnecting in %dms', err.status, delay)
            return timer(delay)
          },
        }),
      )
    })
}
