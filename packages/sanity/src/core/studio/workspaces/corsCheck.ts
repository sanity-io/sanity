import {type SanityClient} from '@sanity/client'
import type QuickLRU from 'quick-lru'

import {type CorsProbeOutcome} from './WorkspacesProvider'

/**
 * How long a passing or inconclusive `/check/cors` answer is reused before
 * the next failed request probes again.
 */
const REUSE_PASSING_OR_INCONCLUSIVE_MS = 10_000

/**
 * Cache of in-flight / recently-settled `/check/cors` probes, keyed by
 * `projectId@apiHost`. Dedupes the burst of concurrent probes a CORS outage
 * triggers, and limits how often a run of failed requests probes again —
 * see {@link checkCors}.
 *
 * @internal
 */
export type CorsCheckCache = QuickLRU<string, Promise<CorsProbeOutcome | null>>

/**
 * Probe `/check/cors` for the current origin, deduping concurrent probes
 * through `cache`. A passing or inconclusive answer is reused for 10 seconds,
 * and a failing one for the cache's max age. Returns:
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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
      // Every request that fails with a network error asks for a probe, and
      // some callers retry without limit (preview fetches), so a tab whose
      // requests keep failing for a reason other than CORS would otherwise
      // probe several times a second. Each probe is an API request.
      //  - `null` (inconclusive) and a positive verdict (`allowed &&
      //    withCredentials`) are reused for
      //    `REUSE_PASSING_OR_INCONCLUSIVE_MS` only: a probe failure may be
      //    transient, and CORS can be changed in Manage while the studio is
      //    open, so a later failure must re-probe soon.
      //  - Negative verdicts (misconfig) and `'project-not-found'` keep the
      //    cache's max age: they drive the CORS / config screens and their
      //    own forced re-checks.
      const isPositive =
        result !== null &&
        result !== 'project-not-found' &&
        result.allowed &&
        result.withCredentials
      // Only touch our own entry: a concurrent `force` recheck may have
      // already replaced it with a newer in-flight probe.
      if ((result === null || isPositive) && cache.get(cacheKey) === check) {
        cache.set(cacheKey, check, {maxAge: REUSE_PASSING_OR_INCONCLUSIVE_MS})
      }
      return result
    })
  cache.set(cacheKey, check)
  return check
}
