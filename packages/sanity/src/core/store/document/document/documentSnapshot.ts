import {shareReplay, type Observable} from 'rxjs'
import {map} from 'rxjs/operators'

import {type DocumentVersionSnapshots, withSnapshots} from '../document-pair/snapshotPair'
import {type DocumentStoreExtraOptions} from '../getPairListener'
import {type PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {type DocumentContext} from './document'
import {memoizedDocumentCheckout} from './memoizedDocumentCheckout'
import {getDocumentMemoizeKey} from './utils'

type DocumentSnapshotContext = DocumentContext & {
  extraOptions?: DocumentStoreExtraOptions
}

interface DocumentSnapshot {
  transactionsPendingEvents$: Observable<PendingMutationsEvent>
  document: DocumentVersionSnapshots
}

/** @internal */
// Single-document version of `snapshotPair`: wraps one checked-out document with snapshot
// and mutation helpers instead of returning draft/published/version snapshot streams.
export const documentSnapshot = memoize(
  (documentId: string, ctx: DocumentSnapshotContext): Observable<DocumentSnapshot> => {
    return memoizedDocumentCheckout(ctx.client, documentId, ctx.extraOptions).pipe(
      map(({document, transactionsPendingEvents$}): DocumentSnapshot => {
        return {
          transactionsPendingEvents$,
          document: withSnapshots(document),
        }
      }),
      shareReplay({refCount: true, bufferSize: 1}),
    )
  },
  (documentId, ctx) => getDocumentMemoizeKey(ctx.client, documentId),
)
