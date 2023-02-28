import type {SanityClient} from '@sanity/client'
import {merge, type Observable} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import type {IdPair} from '../types'
import type {RemoteSnapshotVersionEvent} from './checkoutPair'
import {memoizedPair} from './memoizedPair'

/** @internal */
export const remoteSnapshots = (
  client: SanityClient,
  idPair: IdPair,
  typeName: string
): Observable<RemoteSnapshotVersionEvent> => {
  return memoizedPair(client, idPair, typeName).pipe(
    switchMap(({published, draft}) => merge(published.remoteSnapshot$, draft.remoteSnapshot$))
  )
}
