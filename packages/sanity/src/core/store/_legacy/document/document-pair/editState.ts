import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type Schema} from '@sanity/types'
import {combineLatest, defer, merge, type Observable, of} from 'rxjs'
import {finalize, map, publishReplay, refCount, startWith, switchMap, tap} from 'rxjs/operators'

import {type IdPair, type PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizeKeyGen} from './memoizeKeyGen'
import {snapshotPair} from './snapshotPair'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'
import {getPairFromLocalStorage, savePairToLocalStorage} from './utils/localStoragePOC'

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
  ): Observable<EditStateFor> => {
    const liveEdit = isLiveEditEnabled(ctx.schema, typeName)
    const INITIAL = {
      id: idPair.publishedId,
      type: typeName,
      draft: null,
      published: null,
      liveEdit,
      ready: false,
      transactionSyncLock: null,
    }

    let cachedDocumentPair: {
      draft: SanityDocument | null
      published: SanityDocument | null
    } | null = null

    function getCachedPair() {
      // try first read it from memory
      // if we haven't got it in memory, see if it's in localstorage
      if (cachedDocumentPair) {
        return cachedDocumentPair
      }
      return getPairFromLocalStorage(idPair)
    }

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
        cachedDocumentPair = {draft, published}
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
      // todo: turn this into a proper operator function - It's like startWith only that it takes a function that will be invoked upon subscription
      (input$) => {
        return defer(() => {
          const cachedPair = getCachedPair()
          return merge(
            cachedPair
              ? of({
                  id: idPair.publishedId,
                  type: typeName,
                  draft: cachedPair.draft,
                  published: cachedPair.published,
                  liveEdit,
                  ready: false,
                  transactionSyncLock: null,
                })
              : of(INITIAL),
            input$,
          )
        })
      },
      finalize(() => {
        savePairToLocalStorage(cachedDocumentPair)
      }),
      publishReplay(1),
      refCount(),
    )
  },
  (ctx, idPair, typeName) => memoizeKeyGen(ctx.client, idPair, typeName),
)
