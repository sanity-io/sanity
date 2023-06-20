import {SanityDocument, Schema} from '@sanity/types'
import {combineLatest, Observable} from 'rxjs'
import {map, publishReplay, refCount, startWith, switchMap} from 'rxjs/operators'
import {SanityClient} from '@sanity/client'
import {IdPair, PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'
import {snapshotPair} from './snapshotPair'
import {memoizeKeyGen} from './memoizeKeyGen'

interface TransactionSyncLockState {
  enabled: boolean
}

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
    },
    idPair: IdPair,
    typeName: string
  ): Observable<EditStateFor> => {
    const liveEdit = isLiveEditEnabled(ctx.schema, typeName)
    return snapshotPair(ctx.client, idPair, typeName).pipe(
      switchMap((versions) =>
        combineLatest([
          versions.draft.snapshots$,
          versions.published.snapshots$,
          versions.transactionsPendingEvents$.pipe(
            map((ev: PendingMutationsEvent) => (ev.phase === 'begin' ? LOCKED : NOT_LOCKED)),
            startWith(NOT_LOCKED)
          ),
        ])
      ),
      map(([draftSnapshot, publishedSnapshot, transactionSyncLock]) => ({
        id: idPair.publishedId,
        type: typeName,
        draft: draftSnapshot,
        published: publishedSnapshot,
        liveEdit,
        ready: true,
        transactionSyncLock,
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
      refCount()
    )
  },
  (ctx, idPair, typeName) => memoizeKeyGen(ctx.client, idPair, typeName)
)
