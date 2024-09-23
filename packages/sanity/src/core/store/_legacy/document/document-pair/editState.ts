import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type Schema} from '@sanity/types'
import {combineLatest, type Observable} from 'rxjs'
import {map, publishReplay, refCount, startWith, switchMap, take} from 'rxjs/operators'

import {getVersionFromId} from '../../../../util'
import {type IdPair, type PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizeKeyGen} from './memoizeKeyGen'
import {snapshotPair} from './snapshotPair'
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
  version: SanityDocument | null
  /**
   * Whether live edit is enabled. This may be true for various reasons:
   *
   * - The schema type has live edit enabled.
   * - A version of the document is checked out.
   */
  liveEdit: boolean
  /**
   * Whether the schema type has live edit enabled.
   */
  liveEditSchemaType: boolean
  ready: boolean
  /**
   * When editing a version, the slug of the bundle the document belongs to.
   */
  bundleId?: string
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
    observed$: Observable<(SanityDocument | undefined)[]>,
  ): Observable<EditStateFor> => {
    const liveEditSchemaType = isLiveEditEnabled(ctx.schema, typeName)
    const liveEdit = typeof idPair.versionId !== 'undefined' || liveEditSchemaType

    return observed$.pipe(
      take(1),
      map((observed) => {
        return {
          draft: observed.find((doc) => doc?._id === idPair.draftId) || null,
          published: observed.find((doc) => doc?._id === idPair.publishedId) || null,
        }
      }),
      switchMap((observedPair) => {
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
              ...(typeof versions.version === 'undefined' ? [] : [versions.version.snapshots$]),
            ]),
          ),
          map(([draftSnapshot, publishedSnapshot, transactionSyncLock, versionSnapshot]) => ({
            id: idPair.publishedId,
            type: typeName,
            draft: draftSnapshot,
            published: publishedSnapshot,
            version: typeof idPair.versionId === 'undefined' ? null : versionSnapshot,
            liveEdit,
            liveEditSchemaType,
            ready: true,
            transactionSyncLock,
            bundleId: idPair.versionId ? getVersionFromId(idPair.versionId) : undefined,
          })),
          startWith({
            id: idPair.publishedId,
            type: typeName,
            // Use the observedDocuments if they exist for the initial value.
            draft: observedPair.draft,
            published: observedPair.published,
            version: null,
            liveEdit,
            liveEditSchemaType,
            ready: false,
            transactionSyncLock: null,
            bundleId: idPair.versionId ? getVersionFromId(idPair.versionId) : undefined,
          }),
          publishReplay(1),
          refCount(),
        )
      }),
    )
  },
  (ctx, idPair, typeName) => memoizeKeyGen(ctx.client, idPair, typeName),
)
