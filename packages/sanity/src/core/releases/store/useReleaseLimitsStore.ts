import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  merge,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs'
import {of} from 'rxjs/internal/observable/of'
import {timer} from 'rxjs/internal/observable/timer'

import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {useActiveReleases} from './useActiveReleases'

interface ReleaseLimits {
  datasetReleaseLimit: number
  orgActiveReleaseLimit: number | null
  orgActiveReleaseCount: number
}

type UseReleaseLimitsStoreReturn = [
  cache: ReleaseLimits | null,
  setReleasesUpsellStoreValue: (value: ReleaseLimits) => void,
]

const cacheTrigger$ = new BehaviorSubject<number | null>(null)
const CACHE_TTL_MS = 15000

export const useReleaseLimitsStore = (): UseReleaseLimitsStoreReturn => {
  const resourceCache = useResourceCache()
  const {data: activeReleases} = useActiveReleases()

  const cache$ = useMemo(
    () =>
      cacheTrigger$.pipe(
        distinctUntilChanged(),
        switchMap((activeReleasesCount) => {
          if (activeReleasesCount === null) return of(null)

          const cachedState = resourceCache.get<{
            cachedValue: ReleaseLimits
            activeReleases: number
          }>({
            namespace: 'ReleasesUpsellLimits',
            dependencies: [activeReleases],
          })

          if (cachedState) {
            const {cachedValue, activeReleases: cachedReleases} = cachedState

            if (cachedReleases === activeReleasesCount) {
              console.log('Using cached value.')

              return merge(
                of(cachedValue),
                timer(CACHE_TTL_MS).pipe(
                  map(() => {
                    console.log('TTL expired, emitting null.')
                    cacheTrigger$.next(null)
                    return null
                  }),
                ),
              )
            }
          }

          return of(null)
        }),
        startWith(null),
        shareReplay({bufferSize: 1, refCount: true}),
      ),
    [activeReleases, resourceCache],
  )

  const setReleasesUpsellStoreValue = (value: ReleaseLimits) => {
    const activeReleasesCount = activeReleases?.length || 0

    resourceCache.set({
      dependencies: [activeReleases],
      namespace: 'ReleasesUpsellLimits',
      value: {
        cachedValue: value,
        activeReleases: activeReleasesCount,
      },
    })

    cacheTrigger$.next(activeReleasesCount)
  }

  const cache = useObservable(cache$, null)

  return [cache, setReleasesUpsellStoreValue]
}
