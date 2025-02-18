import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  timer,
} from 'rxjs'

import {type ResourceCache, useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {useActiveReleases} from './useActiveReleases'

interface ReleaseLimits {
  datasetReleaseLimit: number
  orgActiveReleaseLimit: number | null
  orgActiveReleaseCount: number
}

const cacheTrigger$ = new BehaviorSubject<number | null>(null)
const CACHE_TTL_MS = 15000

export function createOrgActiveReleaseCountStore(
  resourceCache: ResourceCache,
  activeReleases: any,
) {
  const dispatch$ = new Subject<number | null>()

  const state$ = merge(
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
    ),
    dispatch$,
  ).pipe(shareReplay({bufferSize: 1, refCount: true}))

  const setOrgActiveReleaseCount = (count: number) => {
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

  return {
    state$,
    setOrgActiveReleaseCount,
  }
}

export const useOrgActiveReleaseCount = () => {
  const resourceCache = useResourceCache()
  const {data: activeReleases} = useActiveReleases()

  const {state$, setOrgActiveReleaseCount} = useMemo(
    () => createOrgActiveReleaseCountStore(resourceCache, activeReleases),
    [resourceCache, activeReleases],
  )

  const cache = useObservable(state$, null)

  return {
    getOrgActiveReleaseCount: () => cache,
    setOrgActiveReleaseCount,
  }
}
