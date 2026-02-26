import {type SanityClient} from '@sanity/client'
import {defer, type Observable, shareReplay, tap} from 'rxjs'

const CACHE_TTL_MS = 5 * 60 * 1000

let cached$: Observable<any> | null = null
let expiresAt = 0

export function getSystemGroups$(client: SanityClient['observable']): Observable<any> {
  const now = Date.now()

  if (!cached$ || now >= expiresAt) {
    cached$ = defer(() => client.fetch('*[_type == "system.group"]{members, grants}')).pipe(
      tap({
        next: () => {
          expiresAt = Date.now() + CACHE_TTL_MS
        },
        error: () => {
          // Reset cache on failure so next call retries
          cached$ = null
          expiresAt = 0
        },
      }),
      shareReplay(1),
    )
  }

  return cached$
}
