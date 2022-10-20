import {catchError, map, shareReplay, startWith} from 'rxjs/operators'
import {Observable, of} from 'rxjs'
import {useMemoObservable} from 'react-rx'
import client from 'part:@sanity/base/client'
import {usePrevious} from '../../hooks/usePrevious'

const versionedClient = client.withConfig({
  apiVersion: '2022-03-07',
})

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
function fetchFeatures(): Observable<string[]> {
  return versionedClient.observable.request<string[]>({
    url: `/features`,
    tag: 'features',
  })
}

const observable = fetchFeatures().pipe(shareReplay())

export function useFeatureEnabled(featureKey: string): Features {
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
