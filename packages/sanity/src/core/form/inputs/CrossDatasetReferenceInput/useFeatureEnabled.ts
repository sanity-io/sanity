import {catchError, map, shareReplay, startWith} from 'rxjs/operators'
import {Observable, of} from 'rxjs'
import {SanityClient} from '@sanity/client'
import {useMemoObservable} from 'react-rx'
import {useClient} from '../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'

type Features = {
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
    url: `/features`,
    tag: 'features',
  })
}

let observable: Observable<string[]>

export function useFeatureEnabled(featureKey: string): Features {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  if (!observable) {
    observable = fetchFeatures({versionedClient}).pipe(shareReplay())
  }

  const featureInfo = useMemoObservable(
    () =>
      observable.pipe(
        map((features) => ({
          isLoading: false,
          enabled: features.includes(featureKey),
          features,
        })),
        startWith(INITIAL_LOADING_STATE),
        catchError((err: Error) => {
          console.error(err)
          return of({isLoading: false, enabled: true, features: []})
        })
      ),
    [featureKey],
    INITIAL_LOADING_STATE
  )

  return featureInfo
}
