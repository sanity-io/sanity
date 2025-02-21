import {type ObservableSanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {BehaviorSubject, catchError, map, type Observable, of, switchMap, tap, timer} from 'rxjs'

import {useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {type ReleaseLimits} from '../contexts/upsell/fetchReleaseLimits'
import {useActiveReleases} from './useActiveReleases'
import {type ReleaseLimitsStore, useReleaseLimits} from './useReleaseLimits'

interface OrgActiveReleaseCountStore {
  orgActiveReleaseCount$: Observable<ReleaseLimits['orgActiveReleaseCount']>
}

// @todo make this 60_000
const STATE_TTL_MS = 15_000
const ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE = 'orgActiveReleaseCount'

function createOrgActiveReleaseCountStore(
  releaseLimits$: ReleaseLimitsStore['releaseLimits$'],
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

        return releaseLimits$.pipe(
          tap(() => activeReleaseCountAtFetch.next(activeReleasesCount)),
          map((data) => data?.orgActiveReleaseCount),
          catchError((error) => {
            console.error('Failed to fetch org release count', error)

            if (!state) throw error

            // return the last state if it exists
            return of(state)
          }),
          switchMap((nextState) => {
            if (typeof nextState === 'number') {
              latestFetchState.next(nextState)
            }

            timer(STATE_TTL_MS).subscribe(() => {
              staleFlag$.next(true)
              activeReleaseCountAtFetch.next(null)
            })

            return of(nextState ?? 0)
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
 * This cache expires after a TTL or whenever the active releases in the current
 * dataset changes.
 *
 * @returns An Observable of the cached value for org's active release count.
 */
export const useOrgActiveReleaseCount = (clientOb: ObservableSanityClient) => {
  const resourceCache = useResourceCache()
  const {data: activeReleases} = useActiveReleases()
  // const client = useClient()
  const {releaseLimits$} = useReleaseLimits(clientOb)

  const activeReleasesCount = activeReleases?.length || 0

  const count = useMemo(() => ({activeReleasesCount}), [activeReleasesCount])

  return useMemo(() => {
    const releaseLimitsStore =
      resourceCache.get<OrgActiveReleaseCountStore>({
        dependencies: [clientOb, count],
        namespace: ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE,
      }) || createOrgActiveReleaseCountStore(releaseLimits$, activeReleasesCount)

    resourceCache.set({
      namespace: ORG_ACTIVE_RELEASE_COUNT_RESOURCE_CACHE_NAMESPACE,
      value: releaseLimitsStore,
      dependencies: [clientOb, count],
    })

    return releaseLimitsStore
  }, [activeReleasesCount, clientOb, count, releaseLimits$, resourceCache])
}
