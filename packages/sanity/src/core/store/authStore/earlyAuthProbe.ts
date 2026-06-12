import {type CurrentUser} from '@sanity/types'

/**
 * Sentinel returned synchronously when the early-auth probe is absent,
 * mismatched, stale, or produced an error result. Callers compare with
 * strict equality (`=== EARLY_PROBE_MISS`).
 *
 * @internal
 */
export const EARLY_PROBE_MISS: unique symbol = Symbol('early-auth-probe-miss')

/**
 * Shape of the note the CLI inline script parks on `window.__sanityEarlyAuth`
 * during HTML parse.
 *
 * @internal
 */
export interface EarlyAuthProbeEntry {
  projectId: string
  /** Bare host, e.g. `api.sanity.io` — no protocol prefix. */
  apiHost: string
  credential: 'cookie' | 'token'
  token: string | null
  startedAt: number
  // Raw body from the CLI inline script; validated at the ok-branch id-guard (trust boundary).
  promise: Promise<
    {type: 'unauthenticated'} | {type: 'ok'; user: unknown} | {type: 'error'; status: number}
  >
}

/**
 * Options for `consumeEarlyAuthProbe`, matching the credential values
 * the CLI inline script would have used when firing the probe.
 *
 * @internal
 */
export interface ConsumeOptions {
  projectId: string
  /** Full URL form, e.g. `https://api.sanity.io`. Protocol is stripped before comparing. */
  apiHost: string
  credential: 'cookie' | 'token'
  token: string | null
}

/** Strip protocol from a host-or-URL string so bare hosts and full URLs compare equal. */
function normalizeHost(value: string): string {
  return value.replace(/^https?:\/\//, '')
}

/**
 * Read and consume `window.__sanityEarlyAuth`, validating it against the
 * provided options.
 *
 * Returns `EARLY_PROBE_MISS` synchronously when:
 * - running outside a browser (SSR / schema-extraction)
 * - the global is absent
 * - any of projectId, apiHost, credential, or token mismatches
 * - the probe's `startedAt` is older than 5 minutes (bfcache stale-result guard)
 *
 * Otherwise returns a `Promise<CurrentUser | null | typeof EARLY_PROBE_MISS>`
 * that NEVER rejects — `{type:'error'}` results and any rejection both map to
 * `EARLY_PROBE_MISS` so callers can safely `await` without a `.catch`.
 *
 * The global is deleted on the FIRST call regardless of validation result,
 * making this StrictMode-safe: a second call always returns `EARLY_PROBE_MISS`.
 *
 * @internal
 */
export function consumeEarlyAuthProbe(
  options: ConsumeOptions,
): Promise<CurrentUser | null | typeof EARLY_PROBE_MISS> | typeof EARLY_PROBE_MISS {
  if (typeof window === 'undefined') {
    return EARLY_PROBE_MISS
  }

  // @ts-expect-error - window.__sanityEarlyAuth is not declared; use ts-expect-error per monorepo convention
  const probe: EarlyAuthProbeEntry | undefined = window.__sanityEarlyAuth

  // Consume-once: delete must happen before any validation that could early-return.
  // @ts-expect-error - window.__sanityEarlyAuth is not declared; use ts-expect-error per monorepo convention
  delete window.__sanityEarlyAuth

  if (!probe) {
    return EARLY_PROBE_MISS
  }

  const hostMatches = normalizeHost(probe.apiHost) === normalizeHost(options.apiHost)
  const fieldsMatch =
    probe.projectId === options.projectId &&
    hostMatches &&
    probe.credential === options.credential &&
    probe.token === options.token

  if (!fieldsMatch) {
    return EARLY_PROBE_MISS
  }

  const fiveMinutesMs = 5 * 60 * 1000
  if (Date.now() - probe.startedAt > fiveMinutesMs) {
    return EARLY_PROBE_MISS
  }

  // The 2-tick flush in createAuthStore initial$ depends on this chain being exactly 2
  // hops (.then + .catch). Adding a hop here breaks the settled-fast-path — update both together.
  return probe.promise
    .then((result) => {
      if (result.type === 'ok') {
        // Validate the raw body before trusting it — a malformed 200 (empty object,
        // error envelope) must not flow through as a junk CurrentUser.
        const maybeUser = result.user as {id?: unknown} | null | undefined
        return typeof maybeUser?.id === 'string' ? (result.user as CurrentUser) : EARLY_PROBE_MISS
      }
      if (result.type === 'unauthenticated') {
        return null
      }
      // type === 'error': preserve the CorsOriginError /ping path in getCurrentUser
      return EARLY_PROBE_MISS
    })
    .catch(() => EARLY_PROBE_MISS)
}

/**
 * Test helper: clears `window.__sanityEarlyAuth` for use in `afterEach`.
 *
 * @internal
 */
export function _clearEarlyAuthGlobal(): void {
  // @ts-expect-error - window.__sanityEarlyAuth is not declared
  window.__sanityEarlyAuth = undefined
}
