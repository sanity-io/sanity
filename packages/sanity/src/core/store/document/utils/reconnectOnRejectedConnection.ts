import {type ReconnectEvent} from '@sanity/client'
import {concat, of, type OperatorFunction, throwError, timer} from 'rxjs'
import {catchError, retry} from 'rxjs/operators'

import {debug} from '../debug'

const RECONNECT: ReconnectEvent = {type: 'reconnect'}

// Doubles per retry up to the cap, so a listener that keeps being rejected
// does not hammer the API.
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
 */
export function reconnectOnRejectedConnection<T>(): OperatorFunction<T, T | ReconnectEvent> {
  return (source) =>
    source.pipe(
      // Surface the rejection as a `reconnect` event, then let `retry` see it.
      catchError((err: unknown) => {
        if (!isRejectedConnection(err)) throw err
        return concat(
          of(RECONNECT),
          throwError(() => err),
        )
      }),
      retry({
        delay: (err: unknown, retryCount) => {
          if (!isRejectedConnection(err)) throw err
          const delay = Math.min(BASE_DELAY_MS * 2 ** (retryCount - 1), MAX_DELAY_MS)
          debug('Listener connection rejected (HTTP %s), reconnecting in %dms', err.status, delay)
          return timer(delay)
        },
      }),
    )
}
