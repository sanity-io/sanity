import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {catchError, map, type Observable, of, shareReplay} from 'rxjs'

import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {fetchReleaseLimits, type ReleaseLimits} from '../contexts/upsell/fetchReleaseLimits'

export interface ReleaseLimitsStore {
  releaseLimits$: Observable<ReleaseLimits | null>
}

const RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE = 'ReleaseLimits'

function createReleaseLimitsStore(client: SanityClient): ReleaseLimitsStore {
  const releaseLimits$ = fetchReleaseLimits(client).pipe(
    map((data) => ({
      defaultOrgActiveReleaseLimit: data.defaultOrgActiveReleaseLimit,
      datasetReleaseLimit: data.datasetReleaseLimit,
      orgActiveReleaseLimit: data.orgActiveReleaseLimit,
      orgActiveReleaseCount: data.orgActiveReleaseCount,
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
export const useReleaseLimits: (clientOb: any) => ReleaseLimitsStore = (clientOb) => {
  const resourceCache = useResourceCache()
  // const client = useClient()

  return useMemo(() => {
    const releaseLimitsStore =
      resourceCache.get<ReleaseLimitsStore>({
        dependencies: [clientOb],
        namespace: RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE,
      }) || createReleaseLimitsStore(clientOb)

    resourceCache.set({
      namespace: RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE,
      value: releaseLimitsStore,
      dependencies: [clientOb],
    })

    return releaseLimitsStore
  }, [clientOb, resourceCache])
}
