import {DEFAULT_STUDIO_CLIENT_HEADERS} from '../../../studioClient'

// Constants and storage keys of the OAuth store (`createOAuthAuthStore`).

// API version of the OAuth store's clients.
const AUTH_API_VERSION = 'v2026-05-04'

// Prefix for the localStorage key holding the OAuth token pair of a project and client.
const OAUTH_TOKENS_STORAGE_PREFIX = '__studio_oauth_tokens_'

// Prefix for the sessionStorage key holding an in-flight OAuth authorization request.
const OAUTH_FLOW_STORAGE_PREFIX = '__studio_oauth_flow_'

/**
 * @internal
 * localStorage key holding the OAuth token pair. Keyed by client as well as project, so switching
 * a Studio to another OAuth application never reuses the previous application's refresh token.
 * Value shape: `OAuthTokens`.
 */
export function getOAuthTokensStorageKey(projectId: string, clientId: string): string {
  return `${OAUTH_TOKENS_STORAGE_PREFIX}${projectId}_${clientId}`
}

/**
 * @internal
 * localStorage debug flag: a number of seconds that caps the access token lifetime the OAuth
 * store believes, so renewals can be watched without changing the OAuth application. The token
 * itself stays valid for its real lifetime on the server. Read on every token response, so it
 * can be set or removed while the studio runs.
 */
export const OAUTH_DEBUG_ACCESS_TOKEN_LIFETIME_KEY = '__studio_oauth_debug_access_token_lifetime'

/**
 * @internal
 * sessionStorage key holding the PKCE verifier and `state` of an authorization request between
 * leaving for the authorization server and returning. Value shape: `OAuthFlow`.
 */
export function getOAuthFlowStorageKey(projectId: string): string {
  return `${OAUTH_FLOW_STORAGE_PREFIX}${projectId}`
}

/**
 * @internal
 * How long `handleCallbackUrl` waits, after an exchange, for the new token to be probed
 * authenticated before it resolves anyway (flagged via `stateSettleTimedOut`), so the UI can't
 * hang.
 */
export const AUTH_STATE_SETTLE_TIMEOUT_MS = 10_000

/**
 * @internal
 * Baseline `ClientConfig` of the OAuth store's client and its signed-in check.
 * Callers add `projectId`, `dataset`, and the credential.
 */
export const AUTH_CLIENT_OPTIONS = {
  apiVersion: AUTH_API_VERSION,
  useCdn: false,
  perspective: 'raw',
  requestTagPrefix: 'sanity.studio',
  allowReconfigure: false,
  headers: DEFAULT_STUDIO_CLIENT_HEADERS,
} as const
