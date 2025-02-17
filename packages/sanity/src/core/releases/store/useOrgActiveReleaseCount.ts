import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  BehaviorSubject,
  distinctUntilChanged,
  firstValueFrom,
  map,
  merge,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs'
import {of} from 'rxjs/internal/observable/of'
import {timer} from 'rxjs/internal/observable/timer'

import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {fetchReleasesLimits} from '../contexts/upsell/ReleasesUpsellProvider'
import {useActiveReleases} from './useActiveReleases'

interface ReleaseLimits {
  datasetReleaseLimit: number
  orgActiveReleaseLimit: number | null
  orgActiveReleaseCount: number
}

type UseOrgActiveReleaseCountReturn = () => Promise<any>

const cacheTrigger$ = new BehaviorSubject<number | null>(null)
const CACHE_TTL_MS = 15000

export const useOrgActiveReleaseCount = (): UseOrgActiveReleaseCountReturn => {
  const resourceCache = useResourceCache()
  const {data: activeReleases} = useActiveReleases()

  const cache$ = useMemo(
    () =>
      cacheTrigger$.pipe(
        distinctUntilChanged(),
        switchMap((activeReleasesCount) => {
          if (activeReleasesCount === null) return of(null)

          const cachedState = resourceCache.get<{
            cachedValue: number
            activeReleases: number
          }>({
            namespace: 'OrgActiveReleasesCount',
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

  const cache = useObservable(cache$, null)

  const getOrgActiveReleasesCountStoreValue = async () => {
    let count = cache

    if (count) return count

    console.log('Cache expired or activeReleases changed. Fetching new data...')

    try {
      const limits = await firstValueFrom(fetchReleasesLimits().pipe(take(1)))
      count = limits.orgActiveReleaseCount

      console.log('Received first API response', count)

      const activeReleasesCount = activeReleases?.length || 0

      resourceCache.set({
        dependencies: [activeReleases],
        namespace: 'OrgActiveReleasesCount',
        value: {
          cachedValue: count,
          activeReleases: activeReleasesCount,
        },
      })

      cacheTrigger$.next(activeReleasesCount)

      return count
    } catch (error) {
      console.error('Error fetching release limits:', error)
    }
  }

  return getOrgActiveReleasesCountStoreValue
}
