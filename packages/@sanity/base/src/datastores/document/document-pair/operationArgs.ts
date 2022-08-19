/* eslint-disable @typescript-eslint/no-use-before-define */
import {combineLatest, Observable} from 'rxjs'
import {map, publishReplay, refCount, switchMap, tap} from 'rxjs/operators'
import {IdPair, OperationArgs} from '../types'
import {memoize} from '../utils/createMemoizer'
import {snapshotPair} from './snapshotPair'

export const operationArgs = memoize(
  (idPair: IdPair, typeName: string): Observable<OperationArgs> => {
    return snapshotPair(idPair, typeName).pipe(
      switchMap((versions) => {
        return combineLatest([
          versions.draft.snapshots$,
          versions.published.snapshots$,
          versions.publishing,
        ]).pipe(
          map(
            ([draft, published, publishing]): OperationArgs => ({
              idPair,
              typeName: typeName,
              snapshots: {draft, published},
              draft: versions.draft,
              published: versions.published,
              publishing,
            })
          )
        )
      }),
      publishReplay(1),
      refCount()
    )
  },
  (idPair, typeName) => idPair.publishedId + typeName
)
