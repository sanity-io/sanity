import {ClientError, ServerError} from '@sanity/client'
import isNativeNetworkError from 'is-network-error'

/** @internal */
export function isTimeoutError(
  error: unknown,
): error is Error & {code: 'ESOCKETTIMEDOUT' | 'ETIMEDOUT'} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT')
  )
}

/** @internal */
export function isNetworkError(error: unknown): error is Error {
  if (typeof error !== 'object' || error === null) return false
  // get-it v8 sets isNetworkError=true on connection errors
  // https://github.com/sanity-io/get-it/blob/9ffc7e0c2d41ffcfd3a33e7525d9d1f6b188f812/src/request/browser-request.ts#L194
  if ('isNetworkError' in error && error.isNetworkError === true) return true
  // get-it's connect/socket timeout path publishes a plain Error with a code
  // but does not set isNetworkError. Treat these timeouts as network errors
  // so they get the same treatment.
  if (isTimeoutError(error)) return true
  return isNativeNetworkError(error)
}

/**
 * Read the Retry-After header off a ClientError, if present. Per RFC 7231,
 * it's either a non-negative delta-seconds integer or an HTTP date.
 *
 * @internal
 */
export function parseRetryAfter(err: ClientError): number | undefined {
  const headers = (err as ClientError & {response?: {headers?: Record<string, string>}}).response
    ?.headers
  const value = headers?.['retry-after']
  if (!value) return undefined
  // Numeric-looking values go through the integer path even when out of
  // range, so negative numbers don't accidentally fall through to the date
  // parser (which can interpret them as historic dates).
  if (/^-?\d+(\.\d+)?$/.test(value.trim())) {
    const seconds = Number(value)
    if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds)
    return undefined
  }
  const dateMs = Date.parse(value)
  if (Number.isFinite(dateMs)) {
    const delta = Math.ceil((dateMs - Date.now()) / 1000)
    return delta > 0 ? delta : 0
  }
  return undefined
}

/**
 * Infrastructure-level error variants the studio's request-error UI knows
 * how to render. Everything else (4xx other than 429, parse errors, etc.)
 * is caller-domain and is never claimed by the studio.
 *
 * @internal
 */
export type RequestErrorClassification =
  | {type: 'networkError'; error: Error}
  | {type: 'serverError'; error: Error}
  | {type: 'rateLimited'; error: Error; retryAfterSeconds?: number}

/**
 * Classify an error as an infrastructure-level request failure, or return
 * `null` when the error is caller-domain (validation errors, permission
 * denials, conflicts, 404s, ...) and should stay with the caller.
 *
 * Note: 401 is intentionally NOT classified here — whether a 401 means
 * "session expired" (studio concern) or "this resource refuses you"
 * (caller concern) requires probing the session, which the channel does
 * separately.
 *
 * @internal
 */
export function classifyRequestError(err: unknown): RequestErrorClassification | null {
  if (err instanceof ClientError) {
    if (err.statusCode === 429) {
      return {type: 'rateLimited', error: err, retryAfterSeconds: parseRetryAfter(err)}
    }
    // 4xx other than 429 are caller-domain — they carry structured context
    // the caller is better positioned to render than a generic dialog.
    return null
  }
  if (err instanceof ServerError) return {type: 'serverError', error: err}
  if (isNetworkError(err)) return {type: 'networkError', error: err}
  return null
}

/** @internal */
export function isUnauthorizedError(err: unknown): err is ClientError {
  return err instanceof ClientError && err.statusCode === 401
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

/**
 * Whether an error originates from a Sanity client request — i.e. one a
 * plugin/customization could have delegated to the studio's error UI via
 * `useStudioErrorHandler()` rather than letting it reach an error
 * boundary. Used to surface a dev-only "did you mean to opt in?" tip.
 *
 * @internal
 */
export function isClientRequestError(err: unknown): boolean {
  return err instanceof ClientError || err instanceof ServerError || isNetworkError(err)
}
