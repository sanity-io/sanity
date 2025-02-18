/* eslint-disable no-console */
import {useMemo} from 'react'
import {BehaviorSubject, map, type Observable, of, switchMap, tap, timer} from 'rxjs'

import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {fetchReleasesLimits} from '../contexts/upsell/ReleasesUpsellProvider'
import {useActiveReleases} from './useActiveReleases'

interface ReleaseLimits {
  orgActiveReleaseCount$: Observable<number | null>
}

const STATE_TTL_MS = 15000
const ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE = 'orgActiveReleaseCount'

function createOrgActiveReleaseCountStore(activeReleasesCount: number): ReleaseLimits {
  const fetchTrigger$ = new BehaviorSubject<'fetch' | number | null>('fetch')
  const staleFlag$ = new BehaviorSubject<boolean>(false)
  const countAtFetch$ = new BehaviorSubject<number | null>(null)

  const orgActiveReleaseCount$ = fetchTrigger$.pipe(
    switchMap((trigger) => {
      if (
        trigger === 'fetch' ||
        staleFlag$.getValue() === true ||
        countAtFetch$.getValue() !== activeReleasesCount
      ) {
        staleFlag$.next(false)

        return fetchReleasesLimits().pipe(
          tap(() => countAtFetch$.next(activeReleasesCount)),
          map((res) => res.orgActiveReleaseCount),
          switchMap((value) => {
            fetchTrigger$.next(value)

            timer(STATE_TTL_MS).subscribe(() => {
              console.log('TTL expired, marking cache as stale.')
              staleFlag$.next(true)
              countAtFetch$.next(null)
            })

            return of(value)
          }),
        )
      }

      return of(trigger)
    }),
  )

  return {
    orgActiveReleaseCount$,
  }
}

export const useOrgActiveReleaseCount = () => {
  const resourceCache = useResourceCache()
  const {data: activeReleases} = useActiveReleases()

  const activeReleasesCount = activeReleases?.length || 0

  const count = useMemo(() => ({activeReleasesCount}), [activeReleasesCount])

  return useMemo(() => {
    const releaseLimitsStore =
      resourceCache.get<ReleaseLimits>({
        dependencies: [count],
        namespace: ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE,
      }) || createOrgActiveReleaseCountStore(activeReleasesCount)

    resourceCache.set({
      namespace: ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE,
      value: releaseLimitsStore,
      dependencies: [count],
    })

    return releaseLimitsStore
  }, [activeReleasesCount, count, resourceCache])
}
