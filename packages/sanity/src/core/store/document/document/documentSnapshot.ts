import {of, type Observable} from 'rxjs'
import {map, publishReplay, refCount} from 'rxjs/operators'

import {type DocumentVersionSnapshots, withSnapshots} from '../document-pair/snapshotPair'
import {type DocumentStoreExtraOptions} from '../getPairListener'
import {type PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {type DocumentContext} from './document'
import {memoizedDocumentCheckout} from './memoizedDocumentCheckout'

type DocumentSnapshotContext = DocumentContext & {
  serverActionsEnabled?: Observable<boolean>
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
    return memoizedDocumentCheckout(
      ctx.client,
      documentId,
      ctx.serverActionsEnabled ?? of(false),
      ctx.extraOptions,
    ).pipe(
      map(({document, transactionsPendingEvents$}): DocumentSnapshot => {
        return {
          transactionsPendingEvents$,
          document: withSnapshots(document),
        }
      }),
      publishReplay(1),
      refCount(),
    )
  },
  (documentId, ctx) => {
    const config = ctx.client.config()
    return `${config.dataset ?? ''}-${config.projectId ?? ''}-${documentId}`
  },
)
