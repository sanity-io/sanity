import {type MonoTypeOperatorFunction, retry, throwError, timer} from 'rxjs'

import {reconnectDelay} from './reconnectListener'

/**
 * Statuses of a rejected request that are worth retrying: 408 and 429 are explicitly transient,
 * and 5xx is a failure on the API's side.
 */
const TRANSIENT_STATUSES = new Set([408, 429])

function statusCodeOf(err: Error): number | undefined {
  // `ClientError` and `ServerError` carry the status and the response, but no `name` of their own,
  // so they are recognised by shape to survive duplicate `@sanity/client` copies.
  if (!('statusCode' in err) || !('response' in err)) return undefined
  return typeof err.statusCode === 'number' ? err.statusCode : undefined
}

/**
 * Whether a request made with `client.fetch()` failed for a reason that the same request can
 * recover from later: the API answered with a transient status, the network failed, or the
 * response timed out.
 *
 * The client has already retried some of these on its own (a 429, 502 or 503 on a query, a
 * network failure on a `GET`) by the time the error arrives, so a failure that reaches this check
 * has outlasted those retries.
 *
 * Not transient:
 * - any other 4xx: an invalid query, a missing dataset, a denied permission. A 401 is handled by
 *   the forced logout flow.
 * - an aborted request (`AbortError`), which is what unsubscribing does
 * - a `CorsOriginError`, which needs the origin to be added to the project
 * - any other error, which is not the request's to recover from
 *
 * @internal
 */
export function isTransientFetchError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const status = statusCodeOf(err)
  if (status !== undefined) {
    return status >= 500 || TRANSIENT_STATUSES.has(status)
  }
  // `get-it` raises a `TimeoutError` when the response headers do not arrive in time, and does
  // not retry it.
  if (err.name === 'TimeoutError') return true
  // A browser's `fetch()` rejects with a bare `TypeError` when the network fails.
  return err.name === 'TypeError'
}

/**
 * Retries a fetch that fails transiently (see `isTransientFetchError`) with the same backoff as a
 * listener reconnect, for as long as it is subscribed. Any other failure is passed on.
 *
 * @internal
 */
export function retryTransientFetch<T>(): MonoTypeOperatorFunction<T> {
  return retry({
    delay: (error, retryCount) =>
      isTransientFetchError(error)
        ? timer(reconnectDelay(retryCount - 1))
        : throwError(() => error),
  })
}
