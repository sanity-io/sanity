import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type Schema} from '@sanity/types'
import {combineLatest, type Observable} from 'rxjs'
import {map, publishReplay, refCount, startWith, switchMap} from 'rxjs/operators'

import {createSWR} from '../../../../util/rxSwr'
import {type PairListenerOptions} from '../getPairListener'
import {type IdPair, type PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizeKeyGen} from './memoizeKeyGen'
import {snapshotPair} from './snapshotPair'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'

interface TransactionSyncLockState {
  enabled: boolean
}

const swr = createSWR<[SanityDocument, SanityDocument, TransactionSyncLockState]>({maxSize: 50})

/**
 * @hidden
 * @beta */
export interface EditStateFor {
  id: string
  type: string
  transactionSyncLock: TransactionSyncLockState | null
  draft: SanityDocument | null
  published: SanityDocument | null
  liveEdit: boolean
  ready: boolean
}
const LOCKED: TransactionSyncLockState = {enabled: true}
const NOT_LOCKED: TransactionSyncLockState = {enabled: false}

/** @internal */
export const editState = memoize(
  (
    ctx: {
      client: SanityClient
      schema: Schema
      serverActionsEnabled: Observable<boolean>
      pairListenerOptions?: PairListenerOptions
    },
    idPair: IdPair,
    typeName: string,
  ): Observable<EditStateFor> => {
    const liveEdit = isLiveEditEnabled(ctx.schema, typeName)

    return snapshotPair(
      ctx.client,
      idPair,
      typeName,
      ctx.serverActionsEnabled,
      ctx.pairListenerOptions,
    ).pipe(
      switchMap((versions) =>
        combineLatest([
          versions.draft.snapshots$,
          versions.published.snapshots$,
          versions.transactionsPendingEvents$.pipe(
            map((ev: PendingMutationsEvent) => (ev.phase === 'begin' ? LOCKED : NOT_LOCKED)),
            startWith(NOT_LOCKED),
          ),
        ]),
      ),
      swr(`${idPair.publishedId}-${idPair.draftId}`),
      map(({value: [draftSnapshot, publishedSnapshot, transactionSyncLock], fromCache}) => ({
        id: idPair.publishedId,
        type: typeName,
        draft: draftSnapshot,
        published: publishedSnapshot,
        liveEdit,
        ready: !fromCache,
        transactionSyncLock: fromCache ? null : transactionSyncLock,
      })),
      startWith({
        id: idPair.publishedId,
        type: typeName,
        draft: null,
        published: null,
        liveEdit,
        ready: false,
        transactionSyncLock: null,
      }),
      publishReplay(1),
      refCount(),
    )
  },
  (ctx, idPair, typeName) => memoizeKeyGen(ctx.client, idPair, typeName),
)
