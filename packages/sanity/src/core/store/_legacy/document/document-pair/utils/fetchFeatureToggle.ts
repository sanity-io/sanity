//this is an example function -- we're just calling a document

import {type SanityClient} from '@sanity/client'
import {map, type Observable, of} from 'rxjs'

//in the "real" code, this would be observable.request, to a URI
export const fetchFeatureToggle = (
  client: SanityClient,
  serverActionsEnabled: boolean,
): Observable<boolean> => {
  if (!serverActionsEnabled) {
    return of(false)
  }
  return client.observable
    .fetch('*[_id == $id][0]', {id: '20449512-1e9c-44f0-a509-417c901fbbbd'})
    .pipe(map((doc) => doc.name.split('CONTROL FOR SERVER ACTIONS: ')[1] === 'enabled'))
}
