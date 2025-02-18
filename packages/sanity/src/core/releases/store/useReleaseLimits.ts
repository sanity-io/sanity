import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {map, type Observable, shareReplay} from 'rxjs'

import {useClient} from '../../hooks/useClient'
import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {fetchReleasesLimits} from '../contexts/upsell/ReleasesUpsellProvider'

interface ReleaseLimits {
  releaseLimits$: Observable<{
    datasetReleaseLimit: number
    orgActiveReleaseLimit: number | null
  }>
}

const RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE = 'ReleaseLimits'

function createReleaseLimitsStore(versionedClient: SanityClient): ReleaseLimits {
  const releaseLimits$ = fetchReleasesLimits({versionedClient}).pipe(
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
