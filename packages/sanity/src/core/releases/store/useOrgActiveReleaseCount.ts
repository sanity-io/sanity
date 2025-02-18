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

const STATE_TTL_MS = 15000
const ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE = 'OrgActiveReleasesCount'

function createOrgActiveReleaseCountStore(
  resourceCache: ResourceCache,
  activeReleases: ReturnType<typeof useActiveReleases>['data'],
) {
  const dispatch$ = new Subject<number | null>()
  const stateTrigger$ = new BehaviorSubject<number | null>(null)

  const state$ = merge(
    stateTrigger$.pipe(
      distinctUntilChanged(),
      switchMap((activeReleasesCount) => {
        if (activeReleasesCount === null) return of(null)

        const cachedState = resourceCache.get<{
          orgActiveReleaseCount: number
          activeReleases: number
        }>({
          namespace: ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE,
          dependencies: [activeReleases],
        })

        if (cachedState) {
          const {orgActiveReleaseCount, activeReleases: cachedReleases} = cachedState

          if (cachedReleases === activeReleasesCount) {
            console.log('Using cached value.')

            return merge(
              of(orgActiveReleaseCount),
              timer(STATE_TTL_MS).pipe(
                map(() => {
                  console.log('TTL expired, emitting null.')
                  resourceCache.set({
                    namespace: ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE,
                    dependencies: [activeReleases],
                    value: null,
                  })

                  stateTrigger$.next(null)
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

  const setOrgActiveReleaseCount = (orgActiveReleaseCount: number) => {
    const activeReleasesCount = activeReleases?.length || 0

    console.log('Storing orgActiveReleaseCount...')
    resourceCache.set({
      namespace: ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE,
      dependencies: [activeReleases],
      value: {
        orgActiveReleaseCount,
        activeReleases: activeReleasesCount,
      },
    })

    stateTrigger$.next(activeReleasesCount)
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

  const state = useObservable(state$, null)

  return {
    getOrgActiveReleaseCount: () => state,
    setOrgActiveReleaseCount,
  }
}
