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
