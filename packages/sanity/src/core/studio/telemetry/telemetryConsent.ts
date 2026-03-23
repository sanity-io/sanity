import {type SanityClient} from '@sanity/client'
import {map, type Observable, shareReplay} from 'rxjs'

/** @internal */
export type ConsentStatus = 'loading' | 'granted' | 'denied'

let cached$: Observable<ConsentStatus> | null = null

/**
 * Returns an observable that resolves the user's telemetry consent status.
 * The result is cached for the lifetime of the session — subsequent calls
 * return the same shared observable without making additional API requests.
 *
 * @internal
 */
export function getTelemetryConsent$(client: SanityClient): Observable<ConsentStatus> {
  if (!cached$) {
    cached$ = client.observable
      .request<{status: string}>({uri: '/intake/telemetry-status', tag: 'telemetry-consent'})
      .pipe(
        map((res): ConsentStatus => (res?.status === 'granted' ? 'granted' : 'denied')),
        shareReplay(1),
      )
  }
  return cached$
}
