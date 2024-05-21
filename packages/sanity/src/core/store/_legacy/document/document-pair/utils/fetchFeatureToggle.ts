import {type SanityClient} from '@sanity/client'
import {map, type Observable, of, ReplaySubject, timeout, timer} from 'rxjs'
import {catchError, share} from 'rxjs/operators'

interface ActionsFeatureToggle {
  actions: boolean
}

//in the "real" code, this would be observable.request, to a URI
export const fetchFeatureToggle = (defaultClient: SanityClient): Observable<boolean> => {
  const client = defaultClient.withConfig({apiVersion: 'X'})
  const {dataset} = defaultClient.config()

  return client.observable
    .request({
      uri: `/data/actions/${dataset}`,
      withCredentials: true,
    })
    .pipe(
      map((res: ActionsFeatureToggle) => res.actions),
      timeout({first: 2000, with: () => of(false)}),
      catchError(() =>
        // If we fail to fetch the feature toggle, we'll just assume it's disabled and fallback to legacy mutations
        of(false),
      ),
      share({
        // replay latest known state to new subscribers
        connector: () => new ReplaySubject(1),
        // this will typically be completed and unsubscribed from right after the answer is received, so we don't want to reset
        resetOnRefCountZero: false,
        // once the fetch has completed, we'll wait for 2 minutes before resetting the state.
        // we'll then check again once a new subscriber comes in
        resetOnComplete: () => timer(1000 * 120),
      }),
    )
}
