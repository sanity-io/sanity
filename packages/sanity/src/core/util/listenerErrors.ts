/**
 * Typed listener errors that the API raises for a failure on its side, which a
 * new connection can recover from (`unavailableError` is a storage or search
 * backend the API could not reach). Every other typed error (`queryParseError`,
 * `queryError`, `permissionDeniedError`, `namespaceNotFoundError`, ...) is
 * caused by the request itself or by the dataset, and reconnecting would only
 * fail the same way.
 */
const TRANSIENT_CHANNEL_ERROR_TYPES = new Set(['internalError', 'timeoutError', 'unavailableError'])

/**
 * Statuses of a rejected listen request that are worth retrying: 408 and 429
 * are explicitly transient, and 5xx is a failure on the API's side.
 */
const TRANSIENT_CONNECTION_STATUSES = new Set([408, 429])

function hasName(err: unknown, name: string): err is Error {
  return err instanceof Error && err.name === name
}

// The `type` of the error payload the API sends with a `channelError` event. The API flattens its
// typed errors to `{error: {type, ...}}`. An error it cannot classify arrives without a type
// (`{error: {description: 'Internal error'}}`). A failure while streaming arrives as `{message}`,
// with no `error` at all: the API sends one when it fails to encode a mutation, and when it detects
// a gap in the event sequence if gap detection is turned on (it is off).
function channelErrorType(err: Error): string | undefined {
  const data = 'data' in err ? err.data : undefined
  if (typeof data !== 'object' || data === null || !('error' in data)) return undefined
  const error = data.error
  if (typeof error !== 'object' || error === null || !('type' in error)) return undefined
  return typeof error.type === 'string' ? error.type : undefined
}

/**
 * Whether a listener (`client.listen()`) failed for a reason a new connection
 * can recover from: the API failed to set the listener up, the stream broke,
 * or the listen request was answered with a transient status.
 *
 * Errors are matched by name to survive duplicate `@sanity/client` copies.
 *
 * Not transient:
 * - a `ChannelError` caused by the request or the dataset (an invalid query, a
 *   deleted dataset, ...)
 * - a `DisconnectError`: the API only sends one when it has evicted the
 *   listener, and reconnecting would defeat that
 * - a listen request rejected with any other 4xx, including a 401 (an invalid
 *   session, handled by the forced logout flow)
 *
 * Network failures never reach the listener's error channel: the EventSource
 * retries them on its own and the client emits a `reconnect` event instead.
 *
 * @internal
 */
export function isTransientListenerError(err: unknown): boolean {
  if (hasName(err, 'ChannelError')) {
    const type = channelErrorType(err)
    return type === undefined || TRANSIENT_CHANNEL_ERROR_TYPES.has(type)
  }
  if (hasName(err, 'MessageError') || hasName(err, 'MessageParseError')) {
    return true
  }
  if (hasName(err, 'ConnectionFailedError')) {
    const status = 'status' in err ? err.status : undefined
    if (typeof status !== 'number') return true
    return status >= 500 || status < 400 || TRANSIENT_CONNECTION_STATUSES.has(status)
  }
  return false
}
