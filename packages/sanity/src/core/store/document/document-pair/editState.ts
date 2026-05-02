import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type Schema} from '@sanity/types'
import {combineLatest, type Observable, of} from 'rxjs'
import {map, publishReplay, refCount, startWith, switchMap} from 'rxjs/operators'

import {getVersionFromId} from '../../../util'
import {measureFirstEmission} from '../../../util/measureFirstEmission'
import {createSWR} from '../../../util/rxSwr'
import {type DocumentStoreExtraOptions} from '../getPairListener'
import {type IdPair, type PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizeKeyGen} from './memoizeKeyGen'
import {snapshotPair} from './snapshotPair'

interface TransactionSyncLockState {
  enabled: boolean
}

const swr = createSWR<
  [SanityDocument, SanityDocument, TransactionSyncLockState, SanityDocument | null]
>({maxSize: 50})

/**
 * @hidden
 * @beta */
export interface EditStateFor {
  id: string
  transactionSyncLock: TransactionSyncLockState | null
  snapshot: SanityDocument | null
  draft: SanityDocument | null
  published: SanityDocument | null
  version: SanityDocument | null
  ready: boolean
  /**
   * When editing a version, the name of the release the document belongs to.
   */
  release: string | undefined
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
      extraOptions?: DocumentStoreExtraOptions
    },
    idPair: IdPair,
    typeName: string,
  ): Observable<EditStateFor> => {
    return snapshotPair(
      ctx.client,
      idPair,
      typeName,
      ctx.serverActionsEnabled,
      ctx.extraOptions,
    ).pipe(
      switchMap((versions) =>
        combineLatest([
          versions.draft.snapshots$,
          versions.published.snapshots$,
          versions.transactionsPendingEvents$.pipe(
            map((ev: PendingMutationsEvent) => (ev.phase === 'begin' ? LOCKED : NOT_LOCKED)),
            startWith(NOT_LOCKED),
          ),
          typeof versions.version === 'undefined' ? of(null) : versions.version.snapshots$,
        ]),
      ),
      swr(`${idPair.publishedId}-${idPair.draftId}-${idPair.versionId}`),
      measureFirstEmission(
        (durationMs, {fromCache, value: [draftSnapshot, publishedSnapshot, versionSnapshot]}) => {
          ctx.extraOptions?.onDocumentPairLoaded?.({
            durationMs,
            fromCache,
            hasPublished: Boolean(publishedSnapshot),
            hasDraft: Boolean(draftSnapshot),
            hasVersion: Boolean(versionSnapshot),
          })
        },
      ),
      map(
        ({
          value: [draftSnapshot, publishedSnapshot, transactionSyncLock, versionSnapshot],
          fromCache,
        }) => ({
          id: idPair.publishedId,
          type: typeName,
          snapshot: null,
          draft: draftSnapshot,
          published: publishedSnapshot,
          version: typeof idPair.versionId === 'undefined' ? null : versionSnapshot,
          ready: !fromCache,
          transactionSyncLock: fromCache ? null : transactionSyncLock,
          release: idPair.versionId ? getVersionFromId(idPair.versionId) : undefined,
        }),
      ),
      startWith({
        id: idPair.publishedId,
        type: typeName,
        snapshot: null,
        draft: null,
        published: null,
        version: null,
        ready: false,
        transactionSyncLock: null,
        release: idPair.versionId ? getVersionFromId(idPair.versionId) : undefined,
      }),
      publishReplay(1),
      refCount(),
    )
  },
  (ctx, idPair, typeName) => memoizeKeyGen(ctx.client, idPair, typeName),
)
