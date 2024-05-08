//this is an example function -- we're just calling a document

import {type SanityClient} from '@sanity/client'
import {map, type Observable, of, ReplaySubject, timer} from 'rxjs'
import {catchError, share} from 'rxjs/operators'

//in the "real" code, this would be observable.request, to a URI
export const fetchFeatureToggle = (client: SanityClient): Observable<boolean> => {
  return client.observable
    .fetch('*[_id == $id][0]', {id: '20449512-1e9c-44f0-a509-417c901fbbbd'})
    .pipe(
      map((doc) => doc.name.split('CONTROL FOR SERVER ACTIONS: ')[1] === 'enabled'),
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
