import {type SanityClient} from '@sanity/client'
import type QuickLRU from 'quick-lru'

import {type CorsProbeOutcome} from './WorkspacesProvider'

/**
 * Cache of in-flight / recently-settled `/check/cors` probes, keyed by
 * `projectId@apiHost`. Exists only to dedupe the burst of concurrent
 * probes a CORS outage triggers — see {@link checkCors}.
 *
 * @internal
 */
export type CorsCheckCache = QuickLRU<string, Promise<CorsProbeOutcome | null>>

/**
 * Probe `/check/cors` for the current origin, deduping concurrent probes
 * through `cache`. Returns:
 *  - a `CorsCheckResult` — the allow/credentials verdict
 *  - `'project-not-found'` — a `404 / SIO-404-PNF` body, i.e. the project
 *    doesn't exist (the CORS endpoint still answers with CORS headers, so
 *    this is the one place a missing project is detectable)
 *  - `null` when the probe can't conclude (no projectId/url, other non-ok
 *    response, network failure, unparseable body)
 *
 * @internal
 */
export function checkCors(
  client: SanityClient,
  cache: CorsCheckCache,
  options: {force?: boolean} = {},
): Promise<CorsProbeOutcome | null> {
  const config = client.config()
  const {projectId, apiHost, url: baseUrl} = config
  if (!projectId || !baseUrl) return Promise.resolve(null)

  const cacheKey = `${projectId}@${apiHost ?? ''}`
  if (options.force) {
    cache.delete(cacheKey)
  } else {
    const cached = cache.get(cacheKey)
    if (cached) return cached
  }
  // Bypass @sanity/client and hit `/check/cors` with a bare `fetch`. The
  // studio's client adds custom headers (`x-sanity-app`, etc.) that push
  // the request out of the CORS-safe set and force a preflight OPTIONS
  // — but for this probe we want a simple request that bounces straight
  // off the server's CORS policy without extra round trips.
  const probeUrl = `${baseUrl.replace(/\/+$/, '')}/check/cors`
  const check = fetch(probeUrl, {method: 'GET', credentials: 'omit'})
    .then(async (response): Promise<CorsProbeOutcome | null> => {
      const body = (await response.json().catch(() => null)) as {
        result?: {allowed?: boolean; withCredentials?: boolean}
        errorCode?: string
      } | null
      // A 404 with the project-not-found error code means the project
      // doesn't exist — the endpoint still sends CORS headers, so this
      // request succeeds where the data API requests can't surface a body.
      if (response.status === 404 && body?.errorCode === 'SIO-404-PNF') {
        return 'project-not-found'
      }
      if (!response.ok) return null
      if (!body) return null
      return {
        allowed: body.result?.allowed === true,
        withCredentials: body.result?.withCredentials === true,
      }
    })
    .catch((): CorsProbeOutcome | null => null)
    .then((result) => {
      // The cache exists only to dedupe the burst of concurrent probes a
      // CORS outage triggers (every failing request probes at once). Once a
      // probe settles, evict it so it can't mask a *later* state change:
      //  - `null` (inconclusive) — a transient probe failure shouldn't
      //    poison subsequent legitimate requests.
      //  - a positive verdict (`allowed && withCredentials`) — CORS can be
      //    changed in Manage while the studio is open, so a fresh network
      //    failure must re-probe rather than trust a stale "all good" and
      //    skip the CORS screen.
      // Negative verdicts (misconfig) are left to drive the CORS screen and
      // its own forced re-checks.
      const isPositive =
        result !== null &&
        result !== 'project-not-found' &&
        result.allowed &&
        result.withCredentials
      // Only evict our own entry: a concurrent `force` recheck may have
      // already replaced it with a newer in-flight probe, and evicting that
      // would resurrect the dedupe-burst this cache exists to prevent.
      if ((result === null || isPositive) && cache.get(cacheKey) === check) {
        cache.delete(cacheKey)
      }
      return result
    })
  cache.set(cacheKey, check)
  return check
}
