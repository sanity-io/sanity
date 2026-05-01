import {type SanityClient} from '@sanity/client'
import {EMPTY, merge, Observable, of, ReplaySubject, share, timer} from 'rxjs'
import {mergeMap} from 'rxjs/operators'

import {type DocumentStoreExtraOptions} from '../getPairListener'
import {memoize} from '../utils/createMemoizer'
import {documentCheckout, type DocumentCheckout} from './documentCheckout'

// How long to keep listener connected for after last unsubscribe.
const LISTENER_RESET_DELAY = 5_000

// Single-document counterpart to `memoizedPair`: shares one checkout/listener per resolved
// document id and keeps it warm briefly after the last subscriber disconnects.
export const memoizedDocumentCheckout: (
  client: SanityClient,
  documentId: string,
  serverActionsEnabled: Observable<boolean>,
  extraOptions?: DocumentStoreExtraOptions,
) => Observable<DocumentCheckout> = memoize(
  (
    client: SanityClient,
    documentId: string,
    serverActionsEnabled: Observable<boolean>,
    documentListenerOptions?: DocumentStoreExtraOptions,
  ): Observable<DocumentCheckout> => {
    return new Observable<DocumentCheckout>((subscriber) => {
      const checkout = documentCheckout(
        documentId,
        client,
        serverActionsEnabled,
        documentListenerOptions,
      )

      return merge(
        of(checkout),
        // Keep the underlying listener alive while the memoized checkout is subscribed.
        checkout.document.events.pipe(mergeMap(() => EMPTY)),
      ).subscribe(subscriber)
    }).pipe(
      share({
        connector: () => new ReplaySubject(1),
        resetOnComplete: true,
        resetOnRefCountZero: () => timer(LISTENER_RESET_DELAY),
      }),
    )
  },
  (client, documentId) => {
    const config = client.config()
    return `${config.dataset ?? ''}-${config.projectId ?? ''}-${documentId}`
  },
)
