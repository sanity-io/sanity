import {type SanityClient} from '@sanity/client'
import {map, type Observable, shareReplay} from 'rxjs'

/** @internal */
export type ConsentStatus = 'loading' | 'granted' | 'denied'

const cache = new Map<string, Observable<ConsentStatus>>()

/**
 * Returns an observable that resolves the user's telemetry consent status.
 * The result is cached per project ID for the lifetime of the session —
 * subsequent calls for the same project return the same shared observable
 * without making additional API requests.
 *
 * @internal
 */
export function getTelemetryConsent$(client: SanityClient): Observable<ConsentStatus> {
  const projectId = client.config().projectId ?? '__default'
  let cached$ = cache.get(projectId)
  if (!cached$) {
    cached$ = client.observable
      .request<{status: string}>({uri: '/intake/telemetry-status', tag: 'telemetry-consent'})
      .pipe(
        map((res): ConsentStatus => (res?.status === 'granted' ? 'granted' : 'denied')),
        shareReplay(1),
      )
    cache.set(projectId, cached$)
  }
  return cached$
}
