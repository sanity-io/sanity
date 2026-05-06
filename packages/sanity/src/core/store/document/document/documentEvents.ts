import {type SanityClient} from '@sanity/client'
import {type Observable} from 'rxjs'
import {switchMap} from 'rxjs/operators'

import {type DocumentVersionEvent} from '../document-pair/checkoutPair'
import {type DocumentStoreExtraOptions} from '../getPairListener'
import {memoize} from '../utils/createMemoizer'
import {memoizedDocumentCheckout} from './memoizedDocumentCheckout'
import {getDocumentMemoizeKey} from './utils'

// Single-document equivalent of pair `documentEvents`: the resolved checkout already points at
// one concrete document, so there is no draft/published merge step.
export const documentEvents: (
  documentId: string,
  client: SanityClient,
  extraOptions?: DocumentStoreExtraOptions,
) => Observable<DocumentVersionEvent> = memoize(
  (
    documentId: string,
    client: SanityClient,
    extraOptions?: DocumentStoreExtraOptions,
  ): Observable<DocumentVersionEvent> => {
    return memoizedDocumentCheckout(client, documentId, extraOptions).pipe(
      switchMap(({document}) => document.events),
    )
  },
  (documentId, client) => getDocumentMemoizeKey(client, documentId),
)
