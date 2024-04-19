//this is an example function -- we're just calling a document

import {type SanityClient} from '@sanity/client'
import {map, type Observable, of} from 'rxjs'

import {type IdPair} from '../../types'
import {memoize} from '../../utils/createMemoizer'

//in the "real" code, this would be observable.request, to a URI
export const featureToggleRequest: (
  client: SanityClient,
  idPair: IdPair,
  serverActionsEnabled: boolean,
) => Observable<boolean> = memoize(
  (client: SanityClient, idPair: IdPair, serverActionsEnabled: boolean): Observable<boolean> => {
    if (!serverActionsEnabled) {
      return of(false)
    }
    return client.observable
      .fetch('*[_id == $id][0]', {id: '20449512-1e9c-44f0-a509-417c901fbbbd'})
      .pipe(map((doc) => doc.name.split('CONTROL FOR SERVER ACTIONS: ')[1] === 'enabled'))
  },
  (client: SanityClient, idPair: IdPair, serverActionsEnabled: boolean) => {
    const config = client.config()
    return `${config.dataset ?? ''}-${config.projectId ?? ''}-${idPair.publishedId}-${serverActionsEnabled ? '-serverActionsEnabled' : ''}`
  },
)
