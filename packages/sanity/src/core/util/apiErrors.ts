import {ClientError} from '@sanity/client'

/** @internal */
export function isUnauthorizedError(err: unknown): err is ClientError {
  return err instanceof ClientError && err.statusCode === 401
}

/**
 * Whether a 401 positively signals a dead session. Every API endpoint tags
 * session-expiry 401s with the `SIO-401-AEX` error code; a 401 *without*
 * it is a resource-level denial (e.g. an authenticated user lacking a
 * grant — some endpoints answer those with 401, not 403) and must stay
 * caller-domain rather than force a logout.
 *
 * @internal
 */
export function isSessionExpiredError(err: unknown): err is ClientError {
  return isUnauthorizedError(err) && getApiErrorCode(err) === 'SIO-401-AEX'
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
