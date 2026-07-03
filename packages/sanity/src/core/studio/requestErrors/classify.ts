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
 * (caller concern) is decided by the API's explicit error code, which the
 * channel checks separately (see {@link isSessionExpiredError}).
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
 * A workspace-level configuration error: the project or dataset the
 * studio is pointed at doesn't exist. Unlike the infrastructure errors
 * above, these are not transient and not recoverable by retry — the user
 * has to fix `projectId`/`dataset` in their config (or create the missing
 * resource). The studio surfaces these as a full-screen takeover rather
 * than the retry/reload dialog.
 *
 * Which variant we can report depends on what the failing endpoint tells
 * us. Only the project/dataset management API carries a structured
 * discriminator; the generic `/data` 404 can't tell missing-project from
 * missing-dataset apart, so it isn't classified as a config error at all
 * (see {@link classifyConfigError}).
 *
 * @internal
 */
export type ConfigErrorClassification = {type: 'projectNotFound'} | {type: 'datasetNotFound'}

/** Shape of the structured fields we read off a 404 response body. */
interface NotFoundBody {
  error?: unknown
  attributes?: {type?: unknown}
}

function notFoundBody(err: ClientError): NotFoundBody | undefined {
  const body = (err as ClientError & {response?: {body?: unknown}}).response?.body
  if (body && typeof body === 'object') return body as NotFoundBody
  return undefined
}

/**
 * Classify a 404 as a studio-configuration error — the project or dataset
 * the studio points at doesn't exist — using only structured response
 * fields (never message text, which isn't stable across endpoints).
 *
 * Recognized structured signals:
 *  - `attributes.type === 'project'` → `projectNotFound`
 *    (project management API)
 *  - `error === 'Dataset not found'` → `datasetNotFound`
 *    (dataset management API; a discrete error code, not free-form text)
 *
 * A 404 without one of these structured signals returns `null` and stays
 * caller-domain — including the generic `/data` 404s, which carry no
 * discriminator and so can't be safely attributed to a missing project or
 * dataset. This classifier only reports what the *response* proves.
 *
 * @internal
 */
export function classifyConfigError(err: unknown): ConfigErrorClassification | null {
  if (!(err instanceof ClientError) || err.statusCode !== 404) return null
  const body = notFoundBody(err)
  if (!body) return null

  // Project management API tags the response with `attributes.type`.
  if (body.attributes?.type === 'project') {
    return {type: 'projectNotFound'}
  }

  // Dataset management API returns a discrete `error` code. This is an
  // equality check on a structured field, not a match against free-form
  // `message` text.
  if (body.error === 'Dataset not found') {
    return {type: 'datasetNotFound'}
  }

  return null
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
