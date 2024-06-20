import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map, shareReplay, startWith} from 'rxjs/operators'

import {useSource} from '../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {useClient} from './useClient'

const EMPTY_ARRAY: [] = []

interface Features {
  enabled: boolean
  error: Error | null
  features: string[]
  isLoading: boolean
}

const INITIAL_LOADING_STATE: Features = {
  enabled: true,
  error: null,
  features: EMPTY_ARRAY,
  isLoading: true,
}

/**
 * fetches all the enabled features for this project
 */
function fetchFeatures({versionedClient}: {versionedClient: SanityClient}): Observable<string[]> {
  return versionedClient.observable.request<string[]>({
    uri: `/features`,
    tag: 'features',
  })
}

const cachedFeatureRequest = new Map<string, Observable<string[]>>()

/** @internal */
export function useFeatureEnabled(featureKey: string): Features {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {projectId} = useSource()

  if (!cachedFeatureRequest.get(projectId)) {
    const features = fetchFeatures({versionedClient}).pipe(shareReplay())
    cachedFeatureRequest.set(projectId, features)
  }

  const featureInfoObservable = useMemo(
    () =>
      (cachedFeatureRequest.get(projectId) || of(EMPTY_ARRAY)).pipe(
        map((features = []) => ({
          isLoading: false,
          enabled: Boolean(features?.includes(featureKey)),
          features,
          error: null,
        })),
        startWith(INITIAL_LOADING_STATE),
        catchError((error: Error) => {
          return of({isLoading: false, enabled: false, features: EMPTY_ARRAY, error})
        }),
      ),
    [featureKey, projectId],
  )
  const featureInfo = useObservable(featureInfoObservable, INITIAL_LOADING_STATE)

  return featureInfo
}
