import {type SanityDocument} from '@sanity/types'
import {combineLatest, type Observable} from 'rxjs'
import {map, publishReplay, refCount, startWith, switchMap} from 'rxjs/operators'

import {getVersionFromId} from '../../../util'
import {createSWR} from '../../../util/rxSwr'
import {type EditStateFor} from '../document-pair/editState'
import {type PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {type DocumentContext} from './document'
import {documentSnapshot} from './documentSnapshot'

interface TransactionSyncLockState {
  enabled: boolean
}

const swr = createSWR<[SanityDocument | null, TransactionSyncLockState]>({maxSize: 50})

const LOCKED: TransactionSyncLockState = {enabled: true}
const NOT_LOCKED: TransactionSyncLockState = {enabled: false}

// Single-document equivalent of pair `editState`: exposes the resolved document as `snapshot`
// while leaving draft/published/version empty because this path listens to exactly one id.
export const documentEditState = memoize(
  (documentId: string, ctx: DocumentContext): Observable<EditStateFor> => {
    return documentSnapshot(documentId, ctx).pipe(
      switchMap(({document, transactionsPendingEvents$}) =>
        combineLatest([
          document.snapshots$,
          transactionsPendingEvents$.pipe(
            map((ev: PendingMutationsEvent) => (ev.phase === 'begin' ? LOCKED : NOT_LOCKED)),
            startWith(NOT_LOCKED),
          ),
        ]),
      ),
      swr(documentId),
      map(
        ({value: [documentSnapshotValue, transactionSyncLock], fromCache}) =>
          ({
            id: documentId,
            snapshot: documentSnapshotValue,
            draft: null,
            published: null,
            version: null,
            ready: !fromCache,
            transactionSyncLock: fromCache ? null : transactionSyncLock,
            release: getVersionFromId(documentId),
          }) satisfies EditStateFor,
      ),
      startWith({
        id: documentId,
        snapshot: null,
        draft: null,
        published: null,
        version: null,
        ready: false,
        transactionSyncLock: null,
        release: getVersionFromId(documentId),
      } satisfies EditStateFor),
      publishReplay(1),
      refCount(),
    )
  },
  (documentId, ctx) => {
    const config = ctx.client.config()
    return `${config.dataset ?? ''}-${config.projectId ?? ''}-${documentId}`
  },
)
