import {type SanityClient} from '@sanity/client'
import type QuickLRU from 'quick-lru'

import {type CorsCheckResult} from './WorkspacesProvider'

/**
 * Cache of in-flight / recently-settled `/check/cors` probes, keyed by
 * `projectId@apiHost`. Exists only to dedupe the burst of concurrent
 * probes a CORS outage triggers — see {@link checkCors}.
 *
 * @internal
 */
export type CorsCheckCache = QuickLRU<string, Promise<CorsCheckResult | null>>

/**
 * Probe `/check/cors` for the current origin, deduping concurrent probes
 * through `cache`. Returns `null` when the probe can't conclude (no
 * projectId/url, non-ok response, network failure, unparseable body).
 *
 * @internal
 */
export function checkCors(
  client: SanityClient,
  cache: CorsCheckCache,
  options: {force?: boolean} = {},
): Promise<CorsCheckResult | null> {
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
    .then(async (response): Promise<CorsCheckResult | null> => {
      if (!response.ok) return null
      const body = (await response.json().catch(() => null)) as {
        result?: {allowed?: boolean; withCredentials?: boolean}
      } | null
      if (!body) return null
      return {
        allowed: body.result?.allowed === true,
        withCredentials: body.result?.withCredentials === true,
      }
    })
    .catch((): CorsCheckResult | null => null)
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
      const isPositive = result !== null && result.allowed && result.withCredentials
      if (result === null || isPositive) cache.delete(cacheKey)
      return result
    })
  cache.set(cacheKey, check)
  return check
}
