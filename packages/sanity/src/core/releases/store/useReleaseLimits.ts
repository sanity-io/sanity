import {useMemo} from 'react'
import {BehaviorSubject, defer, delay, firstValueFrom, map, of, shareReplay, tap} from 'rxjs'

import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'

export const fetchReleasesLimits = () =>
  of({
    orgActiveReleaseCount: 10,
    orgActiveReleaseLimit: 20,
    datasetReleaseLimit: 6,

    // orgActiveReleaseCount: 6,
    // orgActiveReleaseLimit: 6,
    // datasetReleaseLimit: 10,
  }).pipe(
    tap(() => console.log('SEE THIS ONLY ONCE fetchReleasesLimits')),
    delay(3000),
  )
// ✅ Define the return type
interface ReleaseLimits {
  datasetReleaseLimit: number
  orgActiveReleaseLimit: number | null
}

// ✅ BehaviorSubject to **store** the cached value
const releaseLimitsSubject = new BehaviorSubject<ReleaseLimits | null>(null)

export const useReleaseLimits = () => {
  const resourceCache = useResourceCache()

  // ✅ Observable that fetches **only if needed**
  const releaseLimits$ = useMemo(() => {
    return defer(() => {
      const cachedState = resourceCache.get<ReleaseLimits>({
        namespace: 'ReleaseLimits',
        dependencies: [],
      })

      if (cachedState) {
        console.log('Using cached ReleaseLimits')
        return of(cachedState) // ✅ Use existing cache
      }

      console.log('Fetching ReleaseLimits...')
      return fetchReleasesLimits().pipe(
        map(({datasetReleaseLimit, orgActiveReleaseLimit}) => {
          const limits: ReleaseLimits = {datasetReleaseLimit, orgActiveReleaseLimit}

          // ✅ Store in cache **for future calls**
          resourceCache.set({
            namespace: 'ReleaseLimits',
            dependencies: [],
            value: limits,
          })

          // ✅ Store in BehaviorSubject so it never fetches again
          releaseLimitsSubject.next(limits)

          return limits
        }),
      )
    }).pipe(
      shareReplay({bufferSize: 1, refCount: true}), // ✅ Ensures all subscribers share the same result
    )
  }, [resourceCache])

  // ✅ Function to **trigger the fetch only once**
  const fetchReleaseLimits = async () => {
    // ✅ Return cached value if already present
    const existingValue = releaseLimitsSubject.getValue()
    if (existingValue) {
      console.log('Returning already cached ReleaseLimits')
      return existingValue
    }

    // ✅ Otherwise, trigger a new fetch
    console.log('Triggering new fetch for ReleaseLimits...')
    return firstValueFrom(releaseLimits$)
  }

  return fetchReleaseLimits
}
