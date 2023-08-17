import {SanityClient} from '@sanity/client'
import {merge, Observable} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {DocumentVersionEvent} from './checkoutPair'
import {memoizedPair} from './memoizedPair'
import {memoizeKeyGen} from './memoizeKeyGen'

// A stream of all events related to either published or draft, each event comes with a 'target'
// that specifies which version (draft|published) the event is about
export const documentEvents = memoize(
  (client: SanityClient, idPair: IdPair, typeName: string): Observable<DocumentVersionEvent> => {
    return memoizedPair(client, idPair, typeName).pipe(
      switchMap(({draft, published}) => merge(draft.events, published.events)),
    )
  },
  memoizeKeyGen,
)
