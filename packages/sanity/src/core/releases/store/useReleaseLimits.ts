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

interface ReleaseLimits {
  datasetReleaseLimit: number
  orgActiveReleaseLimit: number | null
}

const releaseLimitsSubject = new BehaviorSubject<ReleaseLimits | null>(null)

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
        return of(cachedState) // ✅ Use existing cache
      }

      console.log('Fetching ReleaseLimits...')
      return fetchReleasesLimits().pipe(
        map(({datasetReleaseLimit, orgActiveReleaseLimit}) => {
          const limits: ReleaseLimits = {datasetReleaseLimit, orgActiveReleaseLimit}

          resourceCache.set({
            namespace: 'ReleaseLimits',
            dependencies: [],
            value: limits,
          })

          releaseLimitsSubject.next(limits)

          return limits
        }),
      )
    }).pipe(shareReplay({bufferSize: 1, refCount: true}))
  }, [resourceCache])

  const fetchReleaseLimits = async () => {
    const existingValue = releaseLimitsSubject.getValue()
    if (existingValue) {
      console.log('Returning already cached ReleaseLimits')
      return existingValue
    }

    console.log('Triggering new fetch for ReleaseLimits...')
    return firstValueFrom(releaseLimits$)
  }

  const setLimitsManually = (limits: ReleaseLimits) => {
    console.log('Storing ReleaseLimits...')

    resourceCache.set({
      namespace: 'ReleaseLimits',
      dependencies: [],
      value: limits,
    })

    releaseLimitsSubject.next(limits)
  }

  const getReleaseLimits = () => {
    return (
      releaseLimitsSubject.getValue() ||
      resourceCache.get<ReleaseLimits>({
        namespace: 'ReleaseLimits',
        dependencies: [],
      }) ||
      null
    )
  }

  return {fetchReleaseLimits, setLimitsManually, getReleaseLimits}
}
