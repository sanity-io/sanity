import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {BehaviorSubject, firstValueFrom, scan, shareReplay} from 'rxjs'

import {type ResourceCache, useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {fetchReleasesLimits} from '../contexts/upsell/ReleasesUpsellProvider'

interface ReleaseLimits {
  datasetReleaseLimit: number
  orgActiveReleaseLimit: number | null
}

interface FetchState {
  isFetching: boolean
  isError: boolean
}

const RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE = 'ReleaseLimits'

const releaseLimits$ = new BehaviorSubject<ReleaseLimits | null>(null)
const fetchState$ = new BehaviorSubject<Partial<FetchState>>({})

function createReleaseLimitsStore(resourceCache: ResourceCache) {
  const state$ = releaseLimits$.pipe(shareReplay({bufferSize: 1, refCount: true}))

  const fetchState = fetchState$.pipe(
    scan<Partial<FetchState>, FetchState>(
      (state, patch) => ({
        isFetching: patch.isFetching ?? state.isFetching,
        isError: patch.isError ?? state.isError,
      }),
      {isFetching: false, isError: false},
    ),
    shareReplay({bufferSize: 1, refCount: true}),
  )

  const fetchReleaseLimits = async () => {
    const latestState =
      releaseLimits$.getValue() ??
      resourceCache.get<ReleaseLimits>({
        namespace: RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE,
        dependencies: [],
      })

    if (latestState) {
      console.log('Returning already cached ReleaseLimits')
      releaseLimits$.next(latestState)
      fetchState$.next({isError: false, isFetching: false})
      return latestState
    }

    if (fetchState$.getValue()?.isFetching) {
      console.log('Fetch already in progress, skipping...')
      return null
    }

    console.log('Fetching ReleaseLimits...')
    fetchState$.next({isFetching: true, isError: false})

    try {
      const limits = await firstValueFrom(fetchReleasesLimits())

      resourceCache.set({
        namespace: RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE,
        dependencies: [],
        value: limits,
      })
      releaseLimits$.next(limits)
      fetchState$.next({isFetching: false, isError: false})
      return limits
    } catch (error) {
      console.error('Error fetching ReleaseLimits:', error)
      fetchState$.next({isFetching: false, isError: true})
      return null
    }
  }

  const setReleaseLimits = (limits: ReleaseLimits) => {
    console.log('Storing ReleaseLimits...')
    resourceCache.set({
      namespace: RELEASE_LIMITS_RESOURCE_CACHE_NAMESPACE,
      dependencies: [],
      value: limits,
    })

    releaseLimits$.next(limits)
    fetchState$.next({isError: false, isFetching: false})
  }

  return {
    state$,
    fetchState$: fetchState,
    setReleaseLimits,
    fetchReleaseLimits,
  }
}

export const useReleaseLimits = () => {
  const resourceCache = useResourceCache()

  const {
    state$,
    fetchState$: _fetchState$,
    setReleaseLimits,
    fetchReleaseLimits,
  } = useMemo(() => createReleaseLimitsStore(resourceCache), [resourceCache])

  const state = useObservable(state$, null)
  const fetchState = useObservable(_fetchState$, {isFetching: false, isError: false})

  return {
    getReleaseLimits: () => state,
    isFetching: fetchState.isFetching,
    isError: fetchState.isError,
    setReleaseLimits,
    fetchReleaseLimits,
  }
}
