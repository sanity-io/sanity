/* eslint-disable @typescript-eslint/no-use-before-define */
import type {Observable} from 'rxjs'
import {combineLatest} from 'rxjs'
import {map, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {snapshotPair} from './snapshotPair'
import type {IdPair, OperationArgs} from '../types'
import {memoize} from '../utils/createMemoizer'

export const operationArgs = memoize(
  (idPair: IdPair, typeName: string): Observable<OperationArgs> => {
    return snapshotPair(idPair, typeName).pipe(
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
  (idPair, typeName) => idPair.publishedId + typeName
)
