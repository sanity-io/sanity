import {type SanityClient} from '@sanity/client'
import {shareReplay, type Observable} from 'rxjs'
import {distinctUntilChanged, switchMap} from 'rxjs/operators'

import {type DocumentStoreExtraOptions} from '../getPairListener'
import {memoize} from '../utils/createMemoizer'
import {memoizedDocumentCheckout} from './memoizedDocumentCheckout'
import {getDocumentMemoizeKey} from './utils'

// Single-document equivalent of pair `consistencyStatus`: only the resolved document's
// buffered consistency needs to be observed instead of combining draft and published and versions
export const documentConsistencyStatus: (
  documentId: string,
  client: SanityClient,
  extraOptions?: DocumentStoreExtraOptions,
) => Observable<boolean> = memoize(
  (
    documentId: string,
    client: SanityClient,
    extraOptions?: DocumentStoreExtraOptions,
  ): Observable<boolean> => {
    return memoizedDocumentCheckout(client, documentId, extraOptions).pipe(
      switchMap(({document}) => document.consistency$),
      distinctUntilChanged(),
      shareReplay({bufferSize: 1, refCount: true}),
    )
  },
  (documentId, client) => getDocumentMemoizeKey(client, documentId),
)
