import {type SanityDocument} from '@sanity/types'
import {combineLatest, type Observable} from 'rxjs'
import {map, publishReplay, refCount, startWith, switchMap} from 'rxjs/operators'

import {getDocumentVariantType, getVersionFromId} from '../../../util'
import {createSWR} from '../../../util/rxSwr'
import {type EditStateFor} from '../document-pair/editState'
import {isLiveEditEnabled} from '../document-pair/utils/isLiveEditEnabled'
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
  (documentId: string, typeName: string, ctx: DocumentContext): Observable<EditStateFor> => {
    const documentVariant = getDocumentVariantType(documentId)
    const liveEditSchemaType = isLiveEditEnabled(ctx.schema, typeName)
    const liveEdit = documentVariant === 'version' || liveEditSchemaType

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
      swr(`${documentId}-${typeName}`),
      map(({value: [documentSnapshotValue, transactionSyncLock], fromCache}) => ({
        id: documentId,
        type: typeName,
        snapshot: documentSnapshotValue,
        draft: null,
        published: null,
        version: null,
        liveEdit,
        liveEditSchemaType,
        ready: !fromCache,
        transactionSyncLock: fromCache ? null : transactionSyncLock,
        release: documentVariant === 'version' ? getVersionFromId(documentId) : undefined,
      })),
      startWith({
        id: documentId,
        type: typeName,
        snapshot: null,
        draft: null,
        published: null,
        version: null,
        liveEdit,
        liveEditSchemaType,
        ready: false,
        transactionSyncLock: null,
        release: documentVariant === 'version' ? getVersionFromId(documentId) : undefined,
      }),
      publishReplay(1),
      refCount(),
    )
  },
  (documentId, typeName, ctx) => {
    const config = ctx.client.config()
    return `${config.dataset ?? ''}-${config.projectId ?? ''}-${documentId}-${typeName}`
  },
)
