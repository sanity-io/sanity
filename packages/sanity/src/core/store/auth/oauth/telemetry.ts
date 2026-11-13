// Telemetry the OAuth store reports, already reduced to what is safe to send: booleans, fixed
// strings, rounded numbers and coarse buckets. Never a token or anything derived from one, an
// identifier, a URL, or text a server wrote.

import {OAuthRequestError, OAuthRequestTimeoutError} from './oauthEndpoints'

/** What started a renewal. */
export type OAuthRenewalTrigger =
  /** Due ahead of expiry, while the tab is shown. */
  | 'scheduled'
  /** The tab was shown with a renewal overdue. */
  | 'tab-visible'
  /** A request was rejected as an invalid session. */
  | 'rejected-request'
  /** The signed-in check rejected the access token. */
  | 'rejected-probe'
  /** The stored access token had expired when it was next needed. */
  | 'expired'

/** How a renewal ended. */
export type OAuthRenewalOutcome = 'renewed' | 'adopted-other-tab' | 'session-ended' | 'failed'

/**
 * Why a request to the authorization server failed. `error` is the OAuth error code when the
 * server sent one shaped like a code, `'unrecognized'` when it sent anything else.
 */
export type OAuthFailure =
  | {failureKind: 'http'; httpStatus: number; error?: string}
  | {failureKind: 'timeout' | 'network' | 'other'}

/**
 * Why a session ended. `refresh-refused`: the store ended it when the refresh token was refused.
 * `session-expired` and `session-not-found`: the Studio logged the user out when the API rejected
 * the session even after a renewal.
 */
export type OAuthSessionEndReason =
  | 'user-signed-out'
  | 'refresh-refused'
  | 'session-expired'
  | 'session-not-found'

export type OAuthTokenLifetime = '<5m' | '5-30m' | '30m-2h' | '>2h'
export type OAuthSessionAge = '<1h' | '1-24h' | '1-7d' | '>7d'

/** @internal */
export type OAuthTelemetryEvent =
  | {
      type: 'token-renewed'
      trigger: OAuthRenewalTrigger
      outcome: OAuthRenewalOutcome
      durationMs: number
      /** Whether renewals are serialised across tabs (Web Locks), or only within this tab. */
      lockAvailable: boolean
      /** The lifetime the server gave the new access token. Only for `renewed`. */
      accessTokenLifetime?: OAuthTokenLifetime
      failure?: OAuthFailure
    }
  | {
      type: 'session-ended'
      reason: OAuthSessionEndReason
      /** Missing for a pair stored before the sign-in time was recorded. */
      sessionAge?: OAuthSessionAge
    }
  | {type: 'sign-in-started'}
  | {
      type: 'request-retried'
      /** Whether the retry needed a renewal, rather than a token a renewal had already replaced. */
      renewed: boolean
      /** Whether the retried request went through. */
      recovered: boolean
    }
  | {type: 'origin-check-failed'; result: 'origin-not-allowed' | 'project-not-found'}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function tokenLifetimeBucket(lifetimeMs: number): OAuthTokenLifetime {
  if (lifetimeMs < 5 * MINUTE) return '<5m'
  if (lifetimeMs < 30 * MINUTE) return '5-30m'
  if (lifetimeMs <= 2 * HOUR) return '30m-2h'
  return '>2h'
}

export function sessionAgeBucket(ageMs: number): OAuthSessionAge {
  if (ageMs < HOUR) return '<1h'
  if (ageMs < DAY) return '1-24h'
  if (ageMs < 7 * DAY) return '1-7d'
  return '>7d'
}

/** A failed request to the authorization server, reduced to its status and error code. */
export function failureOf(err: unknown): OAuthFailure {
  if (err instanceof OAuthRequestTimeoutError) return {failureKind: 'timeout'}
  if (err instanceof OAuthRequestError) {
    const {error} = err
    return {
      failureKind: 'http',
      httpStatus: err.statusCode,
      ...(error ? {error} : err.sentError ? {error: 'unrecognized'} : {}),
    }
  }
  if (err instanceof TypeError || isNetworkError(err)) return {failureKind: 'network'}
  return {failureKind: 'other'}
}

function isNetworkError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'isNetworkError' in err &&
    Boolean(err.isNetworkError)
  )
}
