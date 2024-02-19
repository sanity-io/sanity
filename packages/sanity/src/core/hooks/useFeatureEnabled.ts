import {type SanityClient} from '@sanity/client'
import {useMemoObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map, shareReplay, startWith} from 'rxjs/operators'

import {useSource} from '../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {useClient} from './useClient'

interface Features {
  isLoading: boolean
  enabled: boolean
  features: string[]
}

const INITIAL_LOADING_STATE: Features = {
  isLoading: true,
  enabled: true,
  features: [],
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
    const features = fetchFeatures({versionedClient}).pipe(
      shareReplay(),
      catchError((error) => {
        console.error(error)
        // Return an empty list of features if the request fails
        return of([])
      }),
    )
    cachedFeatureRequest.set(projectId, features)
  }

  const featureInfo = useMemoObservable(
    () =>
      (cachedFeatureRequest.get(projectId) || of([])).pipe(
        map((features = []) => ({
          isLoading: false,
          enabled: Boolean(features?.includes(featureKey)),
          features,
        })),
        startWith(INITIAL_LOADING_STATE),
        catchError((err: Error) => {
          console.error(err)
          return of({isLoading: false, enabled: true, features: []})
        }),
      ),
    [featureKey, projectId],
    INITIAL_LOADING_STATE,
  )

  return featureInfo
}
