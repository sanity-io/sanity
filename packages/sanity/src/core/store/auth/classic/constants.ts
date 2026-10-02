import {DEFAULT_STUDIO_CLIENT_HEADERS} from '../../../studioClient'

// Constants and storage keys of the classic store (`createClassicAuthStore`).

// API version of the classic store's requests.
const AUTH_API_VERSION = 'v2026-05-04'

// Prefix for the localStorage key holding a per-project auth token.
const AUTH_TOKEN_STORAGE_PREFIX = '__studio_auth_token_'

// Prefix for the BroadcastChannel / localStorage key for cross-tab cookie auth state.
const COOKIE_AUTH_STATE_PREFIX = '__studio_auth_cookie_state_'

// Prefix for the localStorage key holding the claim record of a minted-but-unclaimed project.
const UNCLAIMED_PROJECT_STORAGE_PREFIX = '__studio_unclaimed_'

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
 * Timeout for the post-exchange `/users/me` probe (see
 * `applyCredentialUpdate` in `createClassicAuthStore`): if that one request takes
 * longer than this, the callback resolves anyway — flagged via
 * `stateSettleTimedOut` — so the UI can't hang. The probe keeps running and
 * still updates the state if it completes.
 */
export const AUTH_STATE_SETTLE_TIMEOUT_MS = 10_000

/** @internal Stable reference for the "not authenticated" auth result. */
export const UNAUTHENTICATED = {authenticated: false} as const

/**
 * @internal
 * Baseline `ClientConfig` of the classic store's clients and its signed-in check.
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
