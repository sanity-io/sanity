import {SanityDocument} from '@sanity/types'
import {combineLatest, concat, EMPTY, Observable, of, timer} from 'rxjs'
import {map, mapTo, publishReplay, refCount, scan, startWith, switchMap, tap} from 'rxjs/operators'
import {IdPair, PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'
import {snapshotPair} from './snapshotPair'

interface TransactionSyncLockState {
  enabled: boolean
}

export interface EditStateFor {
  id: string
  type: string
  transactionSyncLock: TransactionSyncLockState
  draft: SanityDocument | null
  published: SanityDocument | null
  liveEdit: boolean
  ready: boolean
}
const LOCKED: TransactionSyncLockState = {enabled: true}
const NOT_LOCKED: TransactionSyncLockState = {enabled: false}

export const editState = memoize(
  (idPair: IdPair, typeName: string): Observable<EditStateFor> => {
    const liveEdit = isLiveEditEnabled(typeName)
    return snapshotPair(idPair, typeName).pipe(
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
        publishing: false,
        published: null,
        liveEdit,
        ready: false,
        transactionSyncLock: null,
      }),
      publishReplay(1),
      refCount()
    )
  },
  (idPair, typeName) => idPair.publishedId + typeName
)
