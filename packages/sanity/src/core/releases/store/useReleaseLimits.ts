import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {catchError, map, type Observable, of, shareReplay} from 'rxjs'

import {useClient} from '../../hooks/useClient'
import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {fetchReleaseLimits} from '../contexts/upsell/fetchReleaseLimits'

interface ReleaseLimits {
  releaseLimits$: Observable<{
    datasetReleaseLimit: number
    orgActiveReleaseLimit: number | null
  } | null>
}

const RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE = 'ReleaseLimits'

function createReleaseLimitsStore(versionedClient: SanityClient): ReleaseLimits {
  const releaseLimits$ = fetchReleaseLimits({versionedClient}).pipe(
    map((data) => ({
      datasetReleaseLimit: data.datasetReleaseLimit,
      orgActiveReleaseLimit: data.orgActiveReleaseLimit,
    })),
    shareReplay(1),
    catchError((error) => {
      console.error('Failed to fetch release limits', error)

      return of(null)
    }),
  )

  return {
    releaseLimits$,
  }
}

/**
 * @internal
 *
 * Returns a shared observable to a cache of the release limits for the current project.
 *
 * This cache is shared across all instances of this hook, and will only be fetched once.
 * It will never expire as the limits are not expected to change during the lifetime of the render cycle.
 *
 * @returns An Observable of the cached value for the release limits
 */
export const useReleaseLimits: () => ReleaseLimits = () => {
  const resourceCache = useResourceCache()
  const client = useClient({apiVersion: 'vX'})

  return useMemo(() => {
    const releaseLimitsStore =
      resourceCache.get<ReleaseLimits>({
        dependencies: [client],
        namespace: RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE,
      }) || createReleaseLimitsStore(client)

    resourceCache.set({
      namespace: RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE,
      value: releaseLimitsStore,
      dependencies: [client],
    })

    return releaseLimitsStore
  }, [client, resourceCache])
}
