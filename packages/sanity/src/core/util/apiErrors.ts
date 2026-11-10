import {type ConnectionFailedError, type HttpError, isHttpError} from '@sanity/client'

/** @internal */
export function isUnauthorizedError(err: unknown): err is HttpError {
  return isHttpError(err) && err.statusCode === 401
}

/**
 * Whether `err` is a listener/live-events connection the client rejected with a
 * 401. Unlike a data request, the `listen` endpoint never answers 403: access
 * is applied by filtering events, so a rejected connection can only be an
 * invalid or expired session. The rejection is a `ConnectionFailedError`
 * carrying only `status` (no response body, so no `errorCode`), matched by name
 * to survive duplicate `@sanity/client` copies.
 *
 * @internal
 */
export function isConnectionSessionError(err: unknown): err is ConnectionFailedError {
  return (
    err instanceof Error &&
    err.name === 'ConnectionFailedError' &&
    'status' in err &&
    err.status === 401
  )
}

/**
 * Error codes the API uses on 401s that positively signal an invalid session:
 * - `SIO-401-AEX`: the session has expired
 * - `SIO-401-ANF`: the token resolves to no session at all ("Session not
 *   found" — revoked on another device, purged after expiry, or a stale/
 *   corrupted stored token)
 *
 * Both mean no valid session exists, so both warrant a forced logout.
 */
const INVALID_SESSION_ERROR_CODES = ['SIO-401-AEX', 'SIO-401-ANF']

/**
 * Whether a 401 positively signals that no valid session exists. Two shapes:
 *
 * - {@link INVALID_SESSION_ERROR_CODES} on the usual API error body (expired
 *   or unknown session).
 * - `error.type === "unauthenticatedError"` from Content Lake endpoints such
 *   as `/data/history` when the request carried no credentials at all
 *   (`"Authentication required"`). That body has no `errorCode`.
 *
 * A 401 without either signal is a resource-level denial (an authenticated
 * user lacking a grant — some endpoints answer those with 401, not 403) and
 * must stay caller-domain rather than force a logout. Grant denials only
 * happen with a valid session, so they never carry these signals.
 *
 * @internal
 */
export function isInvalidSessionError(err: unknown): err is HttpError {
  if (!isUnauthorizedError(err)) return false
  const code = getApiErrorCode(err)
  if (code !== undefined && INVALID_SESSION_ERROR_CODES.includes(code)) return true
  return isUnauthenticatedError(err)
}

/**
 * Content Lake's no-credentials 401. `error.type` is a structured
 * discriminator, same as the session `errorCode`s — not message text.
 */
function isUnauthenticatedError(err: HttpError): boolean {
  const body = err.response.body
  if (typeof body !== 'object' || body === null || !('error' in body)) return false
  const error = body.error
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'unauthenticatedError'
  )
}

/**
 * The API's machine-readable `errorCode` from a client error response body
 * (e.g. `SIO-401-AEX` for an expired session), or `undefined` if absent. The
 * `ClientError` exposes the parsed body on `response.body` (typed `unknown`);
 * fall back to the stringified `responseBody` since older error shapes only
 * carry that.
 *
 * @internal
 */
export function getApiErrorCode(err: unknown): string | undefined {
  if (!isHttpError(err)) return undefined
  const fromResponse = readErrorCode(err.response.body)
  if (fromResponse) return fromResponse
  const responseBody = 'responseBody' in err ? err.responseBody : undefined
  if (typeof responseBody !== 'string') return undefined
  try {
    return readErrorCode(JSON.parse(responseBody))
  } catch {
    return undefined
  }
}

function readErrorCode(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('errorCode' in value)) return undefined
  const code = value.errorCode
  return typeof code === 'string' ? code : undefined
}
