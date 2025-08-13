import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map, shareReplay, startWith} from 'rxjs/operators'

import {useSource} from '../studio/source'
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

/**
 * Retrieves the features for a given project. This returns a cached observable.
 * The client should be initialized with the options in `DEFAULT_STUDIO_CLIENT_OPTIONS`.
 */
export function getFeatures({
  projectId,
  versionedClient,
}: {
  projectId: string
  versionedClient: SanityClient
}): Observable<string[]> {
  let features = cachedFeatureRequest.get(projectId)
  if (!features) {
    features = fetchFeatures({versionedClient}).pipe(shareReplay())
    cachedFeatureRequest.set(projectId, features)
  }
  return features
}

/** @internal */
export function useFeatureEnabled(featureKey: string): Features {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {projectId} = useSource()

  const req = getFeatures({projectId, versionedClient})

  const featureInfoObservable = useMemo(
    () =>
      req.pipe(
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
    [featureKey, req],
  )
  const featureInfo = useObservable(featureInfoObservable, INITIAL_LOADING_STATE)

  return featureInfo
}
