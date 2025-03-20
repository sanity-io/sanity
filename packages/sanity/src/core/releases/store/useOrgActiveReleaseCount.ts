import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {BehaviorSubject, catchError, map, type Observable, of, switchMap, tap, timer} from 'rxjs'

import {useClient} from '../../hooks/useClient'
import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {fetchReleaseLimits, type ReleaseLimits} from '../contexts/upsell/fetchReleaseLimits'
import {useActiveReleases} from './useActiveReleases'

interface OrgActiveReleaseCountStore {
  orgActiveReleaseCount$: Observable<ReleaseLimits['orgActiveReleaseCount']>
}

const STATE_TTL_MS = 60_000
const ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE = 'orgActiveReleaseCount'

function createOrgActiveReleaseCountStore(
  client: SanityClient,
  activeReleasesCount: number,
): OrgActiveReleaseCountStore {
  const latestFetchState = new BehaviorSubject<number | null>(null)
  const staleFlag$ = new BehaviorSubject<boolean>(false)
  const activeReleaseCountAtFetch = new BehaviorSubject<number | null>(null)

  const orgActiveReleaseCount$ = latestFetchState.pipe(
    switchMap((state) => {
      if (
        state === null ||
        staleFlag$.getValue() === true ||
        activeReleaseCountAtFetch.getValue() !== activeReleasesCount
      ) {
        staleFlag$.next(false)

        return fetchReleaseLimits(client, 'orgActiveReleaseCount').pipe(
          tap(() => activeReleaseCountAtFetch.next(activeReleasesCount)),
          map((data) => data.orgActiveReleaseCount),
          catchError((error) => {
            console.error('Failed to fetch org release count', error)

            if (!state) throw error

            // return the last state if it exists
            return of(state)
          }),
          switchMap((nextState) => {
            latestFetchState.next(nextState)

            timer(STATE_TTL_MS).subscribe(() => {
              staleFlag$.next(true)
              activeReleaseCountAtFetch.next(null)
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

/**
 * @internal
 *
 * Returns a shared observable to a cache of the org's active release count.
 *
 * This cache expires after a TTL or whenever the active releases in the
 * count of active releases in the dataset changes.
 *
 * @returns An Observable of the cached value for org's active release count.
 */
export const useOrgActiveReleaseCount = () => {
  const resourceCache = useResourceCache()
  const {data: activeReleases} = useActiveReleases()
  const client = useClient({apiVersion: 'v2025-02-19'})

  const activeReleasesCount = activeReleases?.length || 0

  // dependencies must be objects not primitives, so nesting activeReleasesCount in an object
  const count = useMemo(() => ({activeReleasesCount}), [activeReleasesCount])

  return useMemo(() => {
    const releaseLimitsStore =
      resourceCache.get<OrgActiveReleaseCountStore>({
        dependencies: [client, count],
        namespace: ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE,
      }) || createOrgActiveReleaseCountStore(client, count.activeReleasesCount)

    resourceCache.set({
      namespace: ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE,
      value: releaseLimitsStore,
      dependencies: [client, count],
    })

    return releaseLimitsStore
  }, [client, count, resourceCache])
}
