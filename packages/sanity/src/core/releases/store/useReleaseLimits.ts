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

export function createReleaseLimitsStore(resourceCache: ResourceCache) {
  const state$ = releaseLimitsSubject.pipe(shareReplay({bufferSize: 1, refCount: true}))

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
      return cachedState
    }

    console.log('Fetching ReleaseLimits...')
    const limits = await firstValueFrom(fetchReleasesLimits())

    resourceCache.set({
      namespace: 'ReleaseLimits',
      dependencies: [],
      value: limits,
    })
    releaseLimitsSubject.next(limits)

    return limits
  }

  const setReleaseLimits = (limits: ReleaseLimits) => {
    console.log('Storing ReleaseLimits...')
    resourceCache.set({
      namespace: 'ReleaseLimits',
      dependencies: [],
      value: limits,
    })

    releaseLimitsSubject.next(limits)
  }

  return {
    state$,
    setReleaseLimits,
    fetchReleaseLimits,
  }
}

export const useReleaseLimits = () => {
  const resourceCache = useResourceCache()

  const {state$, setReleaseLimits, fetchReleaseLimits} = useMemo(
    () => createReleaseLimitsStore(resourceCache),
    [resourceCache],
  )

  const cache = useObservable(state$, null)

  return {
    getReleaseLimits: () => cache,
    setReleaseLimits,
    fetchReleaseLimits,
  }
}
