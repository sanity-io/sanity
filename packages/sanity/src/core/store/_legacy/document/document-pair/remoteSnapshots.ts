import {type SanityClient} from '@sanity/client'
import {EMPTY, merge, type Observable} from 'rxjs'
import {switchMap} from 'rxjs/operators'

import {type DocumentStoreExtraOptions} from '../getPairListener'
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
    pairListenerOptions?: DocumentStoreExtraOptions,
  ): Observable<RemoteSnapshotVersionEvent> => {
    return memoizedPair(client, idPair, typeName, serverActionsEnabled, pairListenerOptions).pipe(
      switchMap(({published, draft, version}) =>
        merge(published.remoteSnapshot$, draft.remoteSnapshot$, version?.remoteSnapshot$ ?? EMPTY),
      ),
    )
  },
  memoizeKeyGen,
)
