import {type HttpError, isHttpError, isTimeoutError} from '@sanity/client'
import isNativeNetworkError from 'is-network-error'

// These live in `util` so that non-studio code (e.g. the document store) can
// depend on them without importing from `studio`; re-exported here to keep
// the public API surface and existing import sites unchanged.
export {getApiErrorCode, isInvalidSessionError, isUnauthorizedError} from '../../util/apiErrors'
export {isTimeoutError}

/**
 * Node / get-it v8 timeout codes. get-it v9 reports timeouts as
 * `TimeoutError` (caught by {@link isTimeoutError}); older transports used
 * `ESOCKETTIMEDOUT` (idle socket) or `ETIMEDOUT` (connect/request deadline)
 * on a plain Error, which `isTimeoutError` no longer matches.
 */
const LEGACY_TIMEOUT_CODES = new Set(['ESOCKETTIMEDOUT', 'ETIMEDOUT'])

/** @internal */
export function isNetworkError(error: unknown): error is Error {
  if (typeof error !== 'object' || error === null) return false
  // get-it sets isNetworkError=true on connection errors.
  if ('isNetworkError' in error && error.isNetworkError === true) return true
  // Treat both get-it header timeouts and platform request-deadline
  // TimeoutErrors as network errors so they get the same treatment.
  if (isTimeoutError(error)) return true
  if ('code' in error && typeof error.code === 'string' && LEGACY_TIMEOUT_CODES.has(error.code)) {
    return true
  }
  return isNativeNetworkError(error)
}

/**
 * Read the Retry-After header off a ClientError, if present. Per RFC 7231,
 * it's either a non-negative delta-seconds integer or an HTTP date.
 *
 * @internal
 */
export function parseRetryAfter(err: HttpError): number | undefined {
  const value = err.response.headers['retry-after']
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
  | {type: 'serverError'; error: HttpError}
  | {type: 'rateLimited'; error: HttpError; retryAfterSeconds?: number}

/**
 * Classify an error as an infrastructure-level request failure, or return
 * `null` when the error is caller-domain (validation errors, permission
 * denials, conflicts, 404s, ...) and should stay with the caller.
 *
 * Note: 401 is intentionally NOT classified here — whether a 401 means
 * "invalid session" (studio concern) or "this resource refuses you"
 * (caller concern) is decided by the API's explicit error code, which the
 * channel checks separately (see {@link isInvalidSessionError}).
 *
 * @internal
 */
export function classifyRequestError(err: unknown): RequestErrorClassification | null {
  if (isHttpError(err)) {
    if (err.statusCode === 429) {
      return {type: 'rateLimited', error: err, retryAfterSeconds: parseRetryAfter(err)}
    }
    if (err.statusCode >= 500) return {type: 'serverError', error: err}
    // 4xx other than 429 are caller-domain. They carry structured context
    // the caller is better positioned to render than a generic dialog.
    return null
  }
  if (isNetworkError(err)) return {type: 'networkError', error: err}
  return null
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

function notFoundBody(err: HttpError): NotFoundBody | undefined {
  const body = err.response.body
  if (!body || typeof body !== 'object') return undefined

  const attributes = 'attributes' in body ? body.attributes : undefined
  return {
    error: 'error' in body ? body.error : undefined,
    attributes:
      attributes && typeof attributes === 'object'
        ? {type: 'type' in attributes ? attributes.type : undefined}
        : undefined,
  }
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
  if (!isHttpError(err) || err.statusCode !== 404) return null
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
 * Whether an error originates from a Sanity client request — i.e. one a
 * plugin/customization could have delegated to the studio's error UI via
 * `useStudioErrorHandler()` rather than letting it reach an error
 * boundary. Used to surface a dev-only "did you mean to opt in?" tip.
 *
 * @internal
 */
export function isClientRequestError(err: unknown): boolean {
  return isHttpError(err) || isNetworkError(err)
}
