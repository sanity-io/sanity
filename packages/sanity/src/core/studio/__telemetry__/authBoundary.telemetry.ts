import {defineEvent} from '@sanity/telemetry'

/** Fired when the AuthBoundary resolves from 'loading' to a final auth state. */
export const AuthBoundaryResolved = defineEvent<{
  durationMs: number
  result: 'logged-in' | 'logged-out' | 'unauthorized' | 'error'
}>({
  name: 'Auth Boundary Resolved',
  version: 2,
  description: 'Time from AuthBoundary mount until auth state is resolved',
})

/**
 * Fired when handleCallbackUrl completes in the auth store.
 *
 * Successful exchange flows resolve only after the post-exchange auth state
 * has been probed (with the exchanged credential) and handed to the state
 * chain, but `durationMs` deliberately keeps its original meaning (exchange
 * + probe, excluding that settle wait) so aggregations stay comparable
 * across releases — hence no version bump. The settle wait is reported
 * separately in the additive `stateSettleDurationMs` / `stateSettleTimedOut`
 * fields.
 */
export const SessionTokenExchangeCompleted = defineEvent<{
  loginMethod: 'dual' | 'cookie' | 'token'
  flow: 'already-authenticated' | 'exchange'
  success: boolean
  durationMs: number
  exchangeDurationMs?: number
  probeDurationMs?: number
  authMethod?: 'cookie' | 'token'
  failureReason?: string
  stateSettleDurationMs?: number
  stateSettleTimedOut?: boolean
}>({
  name: 'Session Token Exchange Completed',
  version: 2,
  description: 'Result of the auth exchange flow in handleCallbackUrl',
})

/**
 * Fired when handleCallbackUrl completes in the OAuth auth store
 * (`auth.experimental_oauth`): the authorization code exchange, or a load
 * without an authorization response (`already-authenticated`). Same meaning
 * of the shared fields as `SessionTokenExchangeCompleted`; `failureReason` is
 * the RFC 6749 error code or a fixed category, never server-provided text.
 */
export const OAuthCodeExchangeCompleted = defineEvent<{
  flow: 'already-authenticated' | 'exchange'
  success: boolean
  durationMs: number
  exchangeDurationMs?: number
  failureReason?: string
  stateSettleDurationMs?: number
  stateSettleTimedOut?: boolean
}>({
  name: 'OAuth Code Exchange Completed',
  version: 1,
  description: 'Result of the OAuth authorization code exchange in handleCallbackUrl',
})

/**
 * Fired when the OAuth auth store (`auth.experimental_oauth`) finishes renewing its access token.
 * Every field is a fixed value, a rounded duration or a coarse bucket: never a token, an
 * identifier, a URL or text from the server. `failure.error` is the OAuth error code, or
 * `'unrecognized'` when the server sent something that is not shaped like one.
 */
export const OAuthTokenRenewed = defineEvent<{
  trigger: 'scheduled' | 'tab-visible' | 'rejected-request' | 'rejected-probe' | 'expired'
  outcome: 'renewed' | 'adopted-other-tab' | 'session-ended' | 'failed'
  durationMs: number
  lockAvailable: boolean
  accessTokenLifetime?: '<5m' | '5-30m' | '30m-2h' | '>2h'
  failure?:
    | {failureKind: 'http'; httpStatus: number; error?: string}
    | {failureKind: 'timeout' | 'network' | 'other'}
}>({
  name: 'OAuth Token Renewed',
  version: 1,
  description: 'Result of a renewal of the OAuth access token',
})

/**
 * Fired when an OAuth session ends in this tab: the user signed out, the refresh token was
 * refused, or the Studio logged the user out because the API rejected the session as expired or
 * not found. `sessionAge` is a coarse bucket of the time since sign-in.
 */
export const OAuthSessionEnded = defineEvent<{
  reason: 'user-signed-out' | 'refresh-refused' | 'session-expired' | 'session-not-found'
  sessionAge?: '<1h' | '1-24h' | '1-7d' | '>7d'
}>({
  name: 'OAuth Session Ended',
  version: 1,
  description: 'An OAuth session ended, and why',
})

/** Fired when the user starts signing in with OAuth. Paired with `OAuthCodeExchangeCompleted`. */
export const OAuthSignInStarted = defineEvent<Record<string, never>>({
  name: 'OAuth Sign-In Started',
  version: 1,
  description: 'The user started signing in with OAuth',
})

/**
 * Fired when the OAuth store retries a request the API rejected as an invalid session. `renewed`:
 * whether it renewed the token first, rather than reuse one a renewal had already replaced.
 */
export const OAuthRequestRetried = defineEvent<{renewed: boolean; recovered: boolean}>({
  name: 'OAuth Request Retried',
  version: 1,
  description: 'A request rejected as an invalid session was retried with a newer token',
})

/** Fired when the OAuth store's origin check at boot finds the Studio's origin not set up. */
export const OAuthOriginCheckFailed = defineEvent<{
  result: 'origin-not-allowed' | 'project-not-found'
}>({
  name: 'OAuth Origin Check Failed',
  version: 1,
  description: "The Studio's origin is not allowed for the project, or the project was not found",
})
