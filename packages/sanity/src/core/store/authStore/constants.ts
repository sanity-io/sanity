import {DEFAULT_STUDIO_CLIENT_HEADERS} from '../../studioClient'

// Shared constants and key construction for the auth store.
//
// Both `createAuthStore` and `probeWorkspaceAuth` read or coordinate on the
// values defined here, so they live in one place to keep the two in sync.

// API version used by all auth-related client requests.
const AUTH_API_VERSION = 'v2026-05-04'

// Prefix for the localStorage key holding a per-project auth token.
const AUTH_TOKEN_STORAGE_PREFIX = '__studio_auth_token_'

// Prefix for the BroadcastChannel / localStorage key for cross-tab cookie auth state.
const COOKIE_AUTH_STATE_PREFIX = '__studio_auth_cookie_state_'

// Prefix for the localStorage key holding the claim record of a minted-but-unclaimed project.
const UNCLAIMED_PROJECT_STORAGE_PREFIX = '__studio_unclaimed_'

// Prefix for the localStorage key holding the OAuth token pair of a project and client.
const OAUTH_TOKENS_STORAGE_PREFIX = '__studio_oauth_tokens_'

// Prefix for the sessionStorage key holding an in-flight OAuth authorization request.
const OAUTH_FLOW_STORAGE_PREFIX = '__studio_oauth_flow_'

/**
 * @internal
 * Timeout for the post-exchange `/users/me` probe (see
 * `applyCredentialUpdate` in `createAuthStore`): if that one request takes
 * longer than this, the callback resolves anyway — flagged via
 * `stateSettleTimedOut` — so the UI can't hang. The probe keeps running and
 * still updates the state if it completes.
 */
export const AUTH_STATE_SETTLE_TIMEOUT_MS = 10_000

/** @internal Stable reference for the "not authenticated" auth result. */
export const UNAUTHENTICATED = {authenticated: false} as const

/** @internal Stable reference for the "authenticated" auth result (without user details). */
export const AUTHENTICATED = {authenticated: true} as const

/**
 * @internal
 * Baseline `ClientConfig` used by every auth-related Sanity client.
 * Callers add `projectId`, `dataset`, and credentials (`token` / `withCredentials`).
 */
export const AUTH_CLIENT_OPTIONS = {
  apiVersion: AUTH_API_VERSION,
  useCdn: false,
  perspective: 'raw',
  requestTagPrefix: 'sanity.studio',
  allowReconfigure: false,
  headers: DEFAULT_STUDIO_CLIENT_HEADERS,
} as const

/** @internal localStorage key holding the per-project auth token. Value shape: `{token?: string}`. */
export function getAuthTokenStorageKey(projectId: string): string {
  return `${AUTH_TOKEN_STORAGE_PREFIX}${projectId}`
}

/** @internal BroadcastChannel / localStorage key for cross-tab cookie auth state. */
export function getCookieAuthStateKey(projectId: string): string {
  return `${COOKIE_AUTH_STATE_PREFIX}${projectId}`
}

/** @internal localStorage key holding the unclaimed-project claim record. Value shape: `UnclaimedProjectRecord`. */
export function getUnclaimedProjectStorageKey(projectId: string): string {
  return `${UNCLAIMED_PROJECT_STORAGE_PREFIX}${projectId}`
}

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
 * sessionStorage key holding the PKCE verifier and `state` of an authorization request between
 * leaving for the authorization server and returning. Value shape: `OAuthFlow`.
 */
export function getOAuthFlowStorageKey(projectId: string): string {
  return `${OAUTH_FLOW_STORAGE_PREFIX}${projectId}`
}
