import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {defer, map, shareReplay} from 'rxjs'

import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {fetchReleasesLimits} from '../contexts/upsell/ReleasesUpsellProvider'

// ✅ Define the return type
interface ReleaseLimits {
  datasetReleaseLimit: number
  orgActiveReleaseLimit: number | null
}

// ✅ Hook that fetches once and reuses the same data forever
export const useReleaseLimits = () => {
  const resourceCache = useResourceCache()

  const releaseLimits$ = useMemo(() => {
    return defer(() => {
      const cachedState = resourceCache.get<ReleaseLimits>({
        namespace: 'ReleaseLimits',
        dependencies: [],
      })

      if (cachedState) {
        console.log('Using cached ReleaseLimits')
        return of(cachedState) // ✅ Reuse existing cached value
      }

      console.log('Fetching ReleaseLimits for the first time...')
      return fetchReleasesLimits().pipe(
        map(({datasetReleaseLimit, orgActiveReleaseLimit}) => {
          const limits: ReleaseLimits = {datasetReleaseLimit, orgActiveReleaseLimit}

          resourceCache.set({
            namespace: 'ReleaseLimits',
            dependencies: [],
            value: limits,
          })

          return limits
        }),
      )
    }).pipe(shareReplay({bufferSize: 1, refCount: false})) // ✅ Ensures all subscribers get the first fetched value
  }, [resourceCache])

  return useObservable(releaseLimits$, null)
}
