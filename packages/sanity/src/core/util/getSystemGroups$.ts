import {type SanityClient} from '@sanity/client'
import QuickLRU from 'quick-lru'
import {defer, type Observable, shareReplay, tap} from 'rxjs'

const CACHE_MAX_AGE = 5 * 60 * 1000
const CACHE_MAX_SIZE = 50

const cache = new QuickLRU<string, Observable<any>>({
  maxAge: CACHE_MAX_AGE,
  maxSize: CACHE_MAX_SIZE,
})

function getCacheKey(client: SanityClient['observable']): string {
  const {projectId, dataset} = client.config()
  return `${projectId}-${dataset}`
}

export function getSystemGroups$(client: SanityClient['observable']): Observable<any> {
  const key = getCacheKey(client)
  const cached$ = cache.get(key)

  if (cached$) {
    return cached$
  }

  const result$ = defer(() => client.fetch('*[_type == "system.group"]{members, grants}')).pipe(
    tap({
      error: () => {
        cache.delete(key)
      },
    }),
    shareReplay(1),
  )

  cache.set(key, result$)
  return result$
}
