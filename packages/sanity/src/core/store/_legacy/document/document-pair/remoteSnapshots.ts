import {type SanityClient} from '@sanity/client'
import {merge, type Observable} from 'rxjs'
import {switchMap} from 'rxjs/operators'

import {type IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {type RemoteSnapshotVersionEvent} from './checkoutPair'
import {memoizedPair} from './memoizedPair'
import {memoizeKeyGen} from './memoizeKeyGen'

/** @internal */
export const remoteSnapshots = memoize(
  (
    client: SanityClient,
    idPair: IdPair,
    typeName: string,
    serverActionsEnabled: Observable<boolean>,
  ): Observable<RemoteSnapshotVersionEvent> => {
    return memoizedPair(client, idPair, typeName, serverActionsEnabled).pipe(
      switchMap(({published, draft}) => merge(published.remoteSnapshot$, draft.remoteSnapshot$)),
    )
  },
  memoizeKeyGen,
)
