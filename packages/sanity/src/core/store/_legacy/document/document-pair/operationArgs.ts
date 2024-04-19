/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-nested-callbacks */

import {type SanityClient} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {combineLatest, type Observable} from 'rxjs'
import {map, publishReplay, refCount, shareReplay, switchMap, take} from 'rxjs/operators'

import {type HistoryStore} from '../../history'
import {type IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizeKeyGen} from './memoizeKeyGen'
import {type OperationArgs} from './operations'
import {snapshotPair} from './snapshotPair'
import {fetchFeatureToggle} from './utils/fetchFeatureToggle'

export const operationArgs = memoize(
  (
    ctx: {
      client: SanityClient
      historyStore: HistoryStore
      schema: Schema
      serverActionsEnabled: boolean
    },
    idPair: IdPair,
    typeName: string,
  ): Observable<OperationArgs> => {
    return fetchFeatureToggle(ctx.client, ctx.serverActionsEnabled).pipe(
      shareReplay(1),
      take(1),
      switchMap((canUseServerActions) =>
        snapshotPair(ctx.client, idPair, typeName, canUseServerActions).pipe(
          switchMap((versions) =>
            combineLatest([versions.draft.snapshots$, versions.published.snapshots$]).pipe(
              map(
                ([draft, published]): OperationArgs => ({
                  ...ctx,
                  serverActionsEnabled: canUseServerActions,
                  idPair,
                  typeName,
                  snapshots: {draft, published},
                  draft: versions.draft,
                  published: versions.published,
                }),
              ),
            ),
          ),
          publishReplay(1),
          refCount(),
        ),
      ),
    )
  },
  (ctx, idPair, typeName) => {
    return memoizeKeyGen(ctx.client, idPair, typeName, ctx.serverActionsEnabled)
  },
)
