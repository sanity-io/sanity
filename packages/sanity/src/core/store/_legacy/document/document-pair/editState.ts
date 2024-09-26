import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type Schema} from '@sanity/types'
import {combineLatest, type Observable} from 'rxjs'
import {finalize, map, publishReplay, refCount, startWith, switchMap, tap} from 'rxjs/operators'

import {type IdPair, type PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {snapshotPair} from './snapshotPair'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'
import {savePairToLocalStorage} from './utils/localStoragePOC'

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
      serverActionsEnabled: Observable<boolean>
    },
    idPair: IdPair,
    typeName: string,
    localStoragePair: {draft: SanityDocument | null; published: SanityDocument | null} | undefined,
  ): Observable<EditStateFor> => {
    const liveEdit = isLiveEditEnabled(ctx.schema, typeName)
    let documentPair: {
      draft: SanityDocument | null
      published: SanityDocument | null
    } | null = null
    return snapshotPair(ctx.client, idPair, typeName, ctx.serverActionsEnabled).pipe(
      switchMap((versions) =>
        combineLatest([
          versions.draft.snapshots$,
          versions.published.snapshots$,
          versions.transactionsPendingEvents$.pipe(
            // eslint-disable-next-line max-nested-callbacks
            map((ev: PendingMutationsEvent) => (ev.phase === 'begin' ? LOCKED : NOT_LOCKED)),
            startWith(NOT_LOCKED),
          ),
        ]),
      ),
      tap(([draft, published]) => {
        documentPair = {draft, published}
      }),
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
        draft: localStoragePair?.draft || null,
        published: localStoragePair?.published || null,
        liveEdit,
        ready: false,
        transactionSyncLock: null,
      }),
      finalize(() => {
        savePairToLocalStorage(documentPair)
      }),
      publishReplay(1),
      refCount(),
    )
  },
  (ctx, idPair, typeName, lsPair) => {
    const config = ctx.client.config()
    return `${config.dataset ?? ''}-${config.projectId ?? ''}-${idPair.publishedId}-${typeName}-${lsPair?.draft?._rev}-${lsPair?.published?._rev}`
  },
)
