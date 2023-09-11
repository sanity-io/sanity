import {catchError, map, shareReplay, startWith} from 'rxjs/operators'
import {Observable, of} from 'rxjs'
import {SanityClient} from '@sanity/client'
import {useMemoObservable} from 'react-rx'
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

let cachedFeatureRequest: Observable<string[]>

/** @internal */
export function useFeatureEnabled(featureKey: string): Features {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  if (!cachedFeatureRequest) {
    cachedFeatureRequest = fetchFeatures({versionedClient}).pipe(shareReplay())
  }

  const featureInfo = useMemoObservable(
    () =>
      cachedFeatureRequest.pipe(
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
    [featureKey],
    INITIAL_LOADING_STATE,
  )

  return featureInfo
}
