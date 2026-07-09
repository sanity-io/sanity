import {ClientError} from '@sanity/client'

/** @internal */
export function isUnauthorizedError(err: unknown): err is ClientError {
  return err instanceof ClientError && err.statusCode === 401
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
 * Whether a 401 positively signals an invalid session (see
 * {@link INVALID_SESSION_ERROR_CODES}). A 401 *without* one of these codes is
 * a resource-level denial (e.g. an authenticated user lacking a grant —
 * some endpoints answer those with 401, not 403) and must stay
 * caller-domain rather than force a logout; grant denials only happen with
 * a valid session, so they never carry these codes.
 *
 * @internal
 */
export function isInvalidSessionError(err: unknown): err is ClientError {
  if (!isUnauthorizedError(err)) return false
  const code = getApiErrorCode(err)
  return code !== undefined && INVALID_SESSION_ERROR_CODES.includes(code)
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
  if (!(err instanceof ClientError)) return undefined
  const fromResponse = readErrorCode(err.response?.body)
  if (fromResponse) return fromResponse
  try {
    return readErrorCode(JSON.parse(err.responseBody ?? ''))
  } catch {
    return undefined
  }
}

function readErrorCode(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('errorCode' in value)) return undefined
  const code = value.errorCode
  return typeof code === 'string' ? code : undefined
}
