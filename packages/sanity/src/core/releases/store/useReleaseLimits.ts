import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {BehaviorSubject, firstValueFrom, shareReplay} from 'rxjs'

import {type ResourceCache, useResourceCache} from '../../store/_legacy/ResourceCacheProvider'
import {fetchReleasesLimits} from '../contexts/upsell/ReleasesUpsellProvider'

interface ReleaseLimits {
  datasetReleaseLimit: number
  orgActiveReleaseLimit: number | null
}

const releaseLimitsSubject = new BehaviorSubject<ReleaseLimits | null>(null)
const isFetchingSubject = new BehaviorSubject<boolean>(false)
const isErrorSubject = new BehaviorSubject<boolean>(false)

export function createReleaseLimitsStore(resourceCache: ResourceCache) {
  const state$ = releaseLimitsSubject.pipe(shareReplay({bufferSize: 1, refCount: true}))
  const isFetching$ = isFetchingSubject.pipe(shareReplay({bufferSize: 1, refCount: true}))
  const isError$ = isErrorSubject.pipe(shareReplay({bufferSize: 1, refCount: true}))

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
      isErrorSubject.next(false)
      return cachedState
    }

    if (isFetchingSubject.value) {
      console.log('Fetch already in progress, skipping...')
      return null
    }

    console.log('Fetching ReleaseLimits...')
    isFetchingSubject.next(true)
    isErrorSubject.next(false)

    try {
      const limits = await firstValueFrom(fetchReleasesLimits())

      resourceCache.set({
        namespace: 'ReleaseLimits',
        dependencies: [],
        value: limits,
      })
      releaseLimitsSubject.next(limits)
      return limits
    } catch (error) {
      console.error('Error fetching ReleaseLimits:', error)
      isErrorSubject.next(true)
      return null
    } finally {
      isFetchingSubject.next(false)
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
    isErrorSubject.next(false)
  }

  return {
    state$,
    isFetching$,
    isError$,
    setReleaseLimits,
    fetchReleaseLimits,
  }
}

export const useReleaseLimits = () => {
  const resourceCache = useResourceCache()

  const {state$, isFetching$, isError$, setReleaseLimits, fetchReleaseLimits} = useMemo(
    () => createReleaseLimitsStore(resourceCache),
    [resourceCache],
  )

  const cache = useObservable(state$, null)
  const isFetching = useObservable(isFetching$, false)
  const isError = useObservable(isError$, false)

  return {
    getReleaseLimits: () => cache,
    isFetching,
    isError,
    setReleaseLimits,
    fetchReleaseLimits,
  }
}
