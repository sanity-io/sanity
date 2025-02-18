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

const releaseLimitsSubject = new BehaviorSubject<ReleaseLimits | null>(null)
const fetchStateSubject = new BehaviorSubject<Partial<FetchState>>({})

export function createReleaseLimitsStore(resourceCache: ResourceCache) {
  const state$ = releaseLimitsSubject.pipe(shareReplay({bufferSize: 1, refCount: true}))

  const fetchState$ = fetchStateSubject.pipe(
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
    const cachedState =
      releaseLimitsSubject.getValue() ??
      resourceCache.get<ReleaseLimits>({
        namespace: 'ReleaseLimits',
        dependencies: [],
      })

    if (cachedState) {
      console.log('Returning already cached ReleaseLimits')
      releaseLimitsSubject.next(cachedState)
      fetchStateSubject.next({isError: false})
      return cachedState
    }

    if (fetchStateSubject.getValue()?.isFetching) {
      console.log('Fetch already in progress, skipping...')
      return null
    }

    console.log('Fetching ReleaseLimits...')
    fetchStateSubject.next({isFetching: true, isError: false})

    try {
      const limits = await firstValueFrom(fetchReleasesLimits())

      resourceCache.set({
        namespace: 'ReleaseLimits',
        dependencies: [],
        value: limits,
      })
      releaseLimitsSubject.next(limits)
      fetchStateSubject.next({isFetching: false, isError: false})
      return limits
    } catch (error) {
      console.error('Error fetching ReleaseLimits:', error)
      fetchStateSubject.next({isFetching: false, isError: true})
      return null
    }
  }

  const setReleaseLimits = (limits: ReleaseLimits) => {
    console.log('Storing ReleaseLimits...')
    resourceCache.set({
      namespace: 'ReleaseLimits',
      dependencies: [],
      value: limits,
    })

    releaseLimitsSubject.next(limits)
    fetchStateSubject.next({isError: false})
  }

  return {
    state$,
    fetchState$,
    setReleaseLimits,
    fetchReleaseLimits,
  }
}

export const useReleaseLimits = () => {
  const resourceCache = useResourceCache()

  const {state$, fetchState$, setReleaseLimits, fetchReleaseLimits} = useMemo(
    () => createReleaseLimitsStore(resourceCache),
    [resourceCache],
  )

  const cache = useObservable(state$, null)
  const fetchState = useObservable(fetchState$, {isFetching: false, isError: false})

  return {
    getReleaseLimits: () => cache,
    isFetching: fetchState.isFetching,
    isError: fetchState.isError,
    setReleaseLimits,
    fetchReleaseLimits,
  }
}
