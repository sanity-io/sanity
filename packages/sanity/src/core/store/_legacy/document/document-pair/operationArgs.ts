/* eslint-disable @typescript-eslint/no-use-before-define */

import {SanityClient} from '@sanity/client'
import {Schema} from '@sanity/types'
import {combineLatest, Observable} from 'rxjs'
import {map, publishReplay, refCount, switchMap} from 'rxjs/operators'
import {HistoryStore} from '../../history'
import {IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {snapshotPair} from './snapshotPair'
import {OperationArgs} from './operations'

export const operationArgs = memoize(
  (
    ctx: {
      client: SanityClient
      historyStore: HistoryStore
      schema: Schema
    },
    idPair: IdPair,
    typeName: string,
  ): Observable<OperationArgs> => {
    return snapshotPair(ctx.client, idPair, typeName).pipe(
      switchMap((versions) =>
        combineLatest([versions.draft.snapshots$, versions.published.snapshots$]).pipe(
          map(
            ([draft, published]): OperationArgs => ({
              ...ctx,
              idPair,
              typeName: typeName,
              snapshots: {draft, published},
              draft: versions.draft,
              published: versions.published,
            }),
          ),
        ),
      ),
      publishReplay(1),
      refCount(),
    )
  },
  (ctx, idPair, typeName) => {
    const config = ctx.client.config()

    return `${config.dataset ?? ''}-${config.projectId ?? ''}-${idPair.publishedId}-${typeName}`
  },
)
