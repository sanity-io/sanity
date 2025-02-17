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
                    resourceCache.set({
                      namespace: 'OrgActiveReleasesCount',
                      dependencies: [activeReleases],
                      value: null,
                    })

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

  useObservable(cache$, null)

  const setOrgActiveReleaseCountManually = (count: number) => {
    const activeReleasesCount = activeReleases?.length || 0

    console.log('Storing orgActiveReleaseCount...')
    resourceCache.set({
      namespace: 'OrgActiveReleasesCount',
      dependencies: [activeReleases],
      value: {
        cachedValue: count,
        activeReleases: activeReleasesCount,
      },
    })

    cacheTrigger$.next(activeReleasesCount)
  }

  const getOrgActiveReleaseCount = () => {
    const cachedState = resourceCache.get<{cachedValue: number; activeReleases: number}>({
      namespace: 'OrgActiveReleasesCount',
      dependencies: [activeReleases],
    })

    return cachedState?.cachedValue ?? null
  }

  return {setOrgActiveReleaseCountManually, getOrgActiveReleaseCount}
}
