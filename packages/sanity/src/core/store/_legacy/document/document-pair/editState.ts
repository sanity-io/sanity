/* eslint-disable no-console */
import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type Schema} from '@sanity/types'
import {combineLatest, defer, from, merge, type Observable, of} from 'rxjs'
import {
  catchError,
  finalize,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators'

import {type IdPair, type PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizeKeyGen} from './memoizeKeyGen'
import {snapshotPair} from './snapshotPair'
import {getPairFromIndexedDB, savePairToIndexedDB} from './utils/indexedDbPOC'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'

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
      // read the memoized value, if we don't have we will search it in the indexedDB
      return cachedDocumentPair
    }

    return defer(() => {
      const cachedPair = getCachedPair()
      if (cachedPair) {
        console.log('using cachedPair, no need to check the indexedDB')
        return of(cachedPair)
      }
      return from(getPairFromIndexedDB(idPair)).pipe(
        catchError((error) => {
          console.error('Error getting pair from IndexedDB:', error)
          // Return an empty pair if there's an error
          return of({draft: null, published: null})
        }),
      )
    }).pipe(
      switchMap((initialPair) => {
        console.log('cached pair', initialPair)
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
          tap(([draftSnapshot, publishedSnapshot]) => {
            cachedDocumentPair = {draft: draftSnapshot, published: publishedSnapshot}
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
            draft: initialPair.draft,
            published: initialPair.published,
            liveEdit,
            ready: false,
            transactionSyncLock: null,
          }),
        )
      }),
      (input$) => {
        return defer(() => {
          const cachedPair = getCachedPair()
          console.log('creating initial value for editState observable, cachedPair:', cachedPair)
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
        console.log(
          'Closing subscription for: ',
          cachedDocumentPair?.published?._id || cachedDocumentPair?.draft?._id,
        )
        savePairToIndexedDB(cachedDocumentPair)
      }),
      publishReplay(1),
      refCount(),
    )
  },
  (ctx, idPair, typeName) => memoizeKeyGen(ctx.client, idPair, typeName),
)
