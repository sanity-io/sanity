/* eslint-disable @typescript-eslint/no-use-before-define */
import {combineLatest, Observable} from 'rxjs'
import {map, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {snapshotPair} from './snapshotPair'
import {IdPair, OperationArgs} from '../types'
import {memoize} from '../utils/createMemoizer'

export const operationArgs = memoize(
  (idPair: IdPair, typeName: string): Observable<OperationArgs> => {
    return snapshotPair(idPair).pipe(
      switchMap((versions) =>
        combineLatest([versions.draft.snapshots$, versions.published.snapshots$]).pipe(
          map(
            ([draft, published]): OperationArgs => ({
              idPair,
              typeName: typeName,
              snapshots: {draft, published},
              draft: versions.draft,
              published: versions.published,
            })
          )
        )
      ),
      publishReplay(1),
      refCount()
    )
  },
  (idPair) => idPair.publishedId
)
