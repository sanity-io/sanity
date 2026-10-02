import {createDebug} from 'obug'

/**
 * Debug logging for the OAuth auth store. Enable in the browser with
 * `localStorage.debug = 'sanity:auth:oauth'` (or `'sanity:auth:*'`) and reload.
 *
 * Tokens are never logged whole: see `tokenTag`.
 */
export const debug = createDebug('sanity:auth:oauth')

/**
 * The first five and last four characters of a token, `sk3w9…4yO`, which is how tokens are
 * usually identified elsewhere (Manage, HARs). Enough to tell two apart, useless on its own.
 */
export function tokenTag(token: string | undefined | null): string {
  if (!token) return 'none'
  if (token.length <= 12) return `${token.slice(0, 3)}…`
  return `${token.slice(0, 5)}…${token.slice(-4)}`
}

/**
 * A fingerprint of a refresh token: a short hash, never any of its characters. A refresh token
 * is a long-lived credential, and the log only needs to show when it changes.
 */
export function refreshTokenTag(token: string | undefined | null): string {
  if (!token) return 'none'
  // FNV-1a, 32 bit: cheap, synchronous, and not meant to resist anything but a glance.
  let hash = 0x811c9dc5
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `#${hash.toString(16).padStart(8, '0')}`
}

/** A one-line description of a token pair for the log. */
export function describeTokens(
  tokens:
    | {accessToken: string; refreshToken?: string; expiresAt: number; refreshAt: number}
    | undefined,
): string {
  if (!tokens) return 'no tokens'
  const now = Date.now()
  const inSeconds = (at: number) => `${Math.round((at - now) / 1000)}s`
  return `access ${tokenTag(tokens.accessToken)} (expires in ${inSeconds(tokens.expiresAt)}, renews in ${inSeconds(tokens.refreshAt)}), refresh ${refreshTokenTag(tokens.refreshToken)}`
}
