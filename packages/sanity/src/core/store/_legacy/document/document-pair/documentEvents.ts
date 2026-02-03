import {type SanityClient} from '@sanity/client'
import {merge, type Observable} from 'rxjs'
import {switchMap} from 'rxjs/operators'

import {type DocumentStoreExtraOptions} from '../getPairListener'
import {type IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {type DocumentVersionEvent} from './checkoutPair'
import {memoizedPair} from './memoizedPair'
import {memoizeKeyGen} from './memoizeKeyGen'

// A stream of all events related to either published or draft, each event comes with a 'target'
// that specifies which version (draft|published) the event is about
export const documentEvents = memoize(
  (
    client: SanityClient,
    idPair: IdPair,
    typeName: string,
    serverActionsEnabled: Observable<boolean>,
    pairListenerOptions?: DocumentStoreExtraOptions,
  ): Observable<DocumentVersionEvent> => {
    return memoizedPair(client, idPair, typeName, serverActionsEnabled, pairListenerOptions).pipe(
      switchMap(({draft, published}) => merge(draft.events, published.events)),
    )
  },
  memoizeKeyGen,
)
