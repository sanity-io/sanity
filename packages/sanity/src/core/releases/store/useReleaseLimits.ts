import {useMemo} from 'react'
import {map, type Observable, shareReplay} from 'rxjs'

import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {fetchReleasesLimits} from '../contexts/upsell/ReleasesUpsellProvider'

interface ReleaseLimits {
  releaseLimits$: Observable<{
    datasetReleaseLimit: number
    orgActiveReleaseLimit: number | null
  }>
}

const RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE = 'ReleaseLimits'

function createReleaseLimitsStore(): ReleaseLimits {
  const releaseLimits$ = fetchReleasesLimits().pipe(
    map((res) => ({
      datasetReleaseLimit: res.datasetReleaseLimit,
      orgActiveReleaseLimit: res.orgActiveReleaseLimit,
    })),
    shareReplay(1),
  )

  return {
    releaseLimits$,
  }
}

export const useReleaseLimits: () => ReleaseLimits = () => {
  const resourceCache = useResourceCache()

  return useMemo(() => {
    const releaseLimitsStore =
      resourceCache.get<ReleaseLimits>({
        dependencies: [],
        namespace: RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE,
      }) || createReleaseLimitsStore()

    resourceCache.set({
      namespace: RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE,
      value: releaseLimitsStore,
      dependencies: [],
    })

    return releaseLimitsStore
  }, [resourceCache])
}
