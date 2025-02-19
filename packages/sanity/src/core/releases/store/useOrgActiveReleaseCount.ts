/* eslint-disable no-console */
import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {BehaviorSubject, map, type Observable, of, switchMap, tap, timer} from 'rxjs'

import {useClient} from '../../hooks/useClient'
import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {fetchReleasesLimits} from '../contexts/upsell/ReleasesUpsellProvider'
import {useActiveReleases} from './useActiveReleases'

interface ReleaseLimits {
  orgActiveReleaseCount$: Observable<number | null>
}

const STATE_TTL_MS = 15000
const ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE = 'orgActiveReleaseCount'

function createOrgActiveReleaseCountStore(
  versionedClient: SanityClient,
  activeReleasesCount: number,
): ReleaseLimits {
  const latestFetchState = new BehaviorSubject<number | null>(null)
  const staleFlag$ = new BehaviorSubject<boolean>(false)
  const countAtFetch$ = new BehaviorSubject<number | null>(null)

  const orgActiveReleaseCount$ = latestFetchState.pipe(
    switchMap((state) => {
      if (
        state === null ||
        staleFlag$.getValue() === true ||
        countAtFetch$.getValue() !== activeReleasesCount
      ) {
        staleFlag$.next(false)

        return fetchReleasesLimits({versionedClient}).pipe(
          tap(() => countAtFetch$.next(activeReleasesCount)),
          map((res) => res.orgActiveReleaseCount),
          switchMap((nextState) => {
            latestFetchState.next(nextState)

            timer(STATE_TTL_MS).subscribe(() => {
              console.log('TTL expired, marking cache as stale.')
              staleFlag$.next(true)
              countAtFetch$.next(null)
            })

            return of(nextState)
          }),
        )
      }

      return of(state)
    }),
  )

  return {
    orgActiveReleaseCount$,
  }
}

export const useOrgActiveReleaseCount = () => {
  const resourceCache = useResourceCache()
  const {data: activeReleases} = useActiveReleases()
  const client = useClient()

  const activeReleasesCount = activeReleases?.length || 0

  const count = useMemo(() => ({activeReleasesCount}), [activeReleasesCount])

  return useMemo(() => {
    const releaseLimitsStore =
      resourceCache.get<ReleaseLimits>({
        dependencies: [client, count],
        namespace: ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE,
      }) || createOrgActiveReleaseCountStore(client, activeReleasesCount)

    resourceCache.set({
      namespace: ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE,
      value: releaseLimitsStore,
      dependencies: [client, count],
    })

    return releaseLimitsStore
  }, [activeReleasesCount, client, count, resourceCache])
}
