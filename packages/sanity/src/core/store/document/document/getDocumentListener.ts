import {type SanityDocument, type SanityClient} from '@sanity/client'
import {
  type Observable,
  catchError,
  concatMap,
  defer,
  map,
  mergeMap,
  of,
  scan,
  share,
  throwError,
} from 'rxjs'

import {shareReplayLatest} from '../../../preview/utils/shareReplayLatest'
import {debug} from '../debug'
import {
  type DocumentStoreExtraOptions,
  isMutationEvent,
  isMultiTransactionEvent,
  type ListenerEvent,
  allPendingTransactionEventsReceived,
  PENDING_END,
  PENDING_START,
} from '../getPairListener'
import {
  type MutationEvent,
  type ReconnectEvent,
  type ResetEvent,
  type WelcomeBackEvent,
  type WelcomeEvent,
} from '../types'
import {dedupeListenerEvents} from '../utils/dedupeListenerEvents'
import {sequentializeListenerEvents, OutOfSyncError} from '../utils/sequentializeListenerEvents'

type Snapshot = SanityDocument | null
interface InitialSnapshotEvent {
  type: 'snapshot'
  documentId: string
  document: Snapshot
}

// Single-document equivalent of `getPairListener`: listens and fetches one resolved document id
// while preserving reset, resume, buffering, and out-of-sync recovery behavior.
export function getDocumentListener(
  client: SanityClient,
  documentId: string,
  options: Pick<DocumentStoreExtraOptions, 'tag' | 'onSyncErrorRecovery'>,
) {
  const events$ = defer(() =>
    (
      client.observable.listen(
        `*[_id == $id]`,
        {
          id: documentId,
        },
        {
          includeResult: false,
          includeAllVersions: true,
          enableResume: true,
          events: ['welcome', 'mutation', 'reconnect', 'reset', 'welcomeback'],
          effectFormat: 'mendoza',
          tag: options.tag || 'document.listener',
        },
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      ) as Observable<WelcomeEvent | MutationEvent | ReconnectEvent | WelcomeBackEvent | ResetEvent>
    ).pipe(
      dedupeListenerEvents(),
      map((event) =>
        event.type === 'mutation'
          ? {
              ...event,
              // client equivalent of `event.messageDispatchedAt`
              // note: consider moving this to client.listen()
              messageReceivedAt: new Date().toString(),
            }
          : event,
      ),
      shareReplayLatest({
        predicate: (event) =>
          event.type === 'welcome' ||
          event.type === 'reconnect' ||
          event.type === 'reset' ||
          event.type === 'welcomeback',
      }),
    ),
  )

  const documentEvents$ = events$
    .pipe(
      concatMap((event) => {
        const shouldSyncDocument =
          event.type === 'reset' ||
          // note: resumability may not be enabled – if so, treat welcome the same way as a reset
          event.type === 'welcome'
        if (!shouldSyncDocument) {
          return of(event)
        }
        return client.observable
          .getDocument(documentId, {tag: 'document.listener.fetch'})
          .pipe(map((document) => createSnapshotEvent(documentId, document ?? null)))
      }),
      scan(
        (
          acc: {
            next: (InitialSnapshotEvent | ListenerEvent | WelcomeEvent)[]
            buffer: (InitialSnapshotEvent | ListenerEvent | WelcomeEvent)[]
          },
          msg,
        ) => {
          // we only care about mutation events
          if (!isMutationEvent(msg)) {
            return {next: [msg], buffer: []}
          }

          const isBuffering = acc.buffer.length > 0
          const isMulti = isMultiTransactionEvent(msg)
          if (!isMulti && !isBuffering) {
            // simple case, we have no buffer, and the event is a single-transaction event, so just pass it on
            return {next: [msg], buffer: []}
          }

          if (!isMulti) {
            // we have received a single transaction event while waiting for the rest of events from a multi transaction
            // put it in the buffer
            return {next: [], buffer: acc.buffer.concat(msg)}
          }

          const nextBuffer = acc.buffer.concat(msg)
          if (allPendingTransactionEventsReceived(nextBuffer)) {
            // we have received all pending transactions, emit the buffer, and signal end of buffer
            return {next: nextBuffer.concat(PENDING_END), buffer: []}
          }
          // if we get here, we are still waiting for more multi-transaction messages
          // if nextBuffer only has one element, we know we just started buffering
          return {next: nextBuffer.length === 1 ? [PENDING_START] : [], buffer: nextBuffer}
        },
        {next: [], buffer: []},
      ),
      // note: this flattens the array, and in the case of an empty array, no event will be pushed downstream
      mergeMap((v) => v.next),
      share(),
    )
    .pipe(sequentializeListenerEvents())
  return documentEvents$.pipe(
    catchError((err, caught$) => {
      if (err instanceof OutOfSyncError) {
        debug('Recovering from OutOfSyncError: %s', err.name)
        if (typeof options?.onSyncErrorRecovery === 'function') {
          options?.onSyncErrorRecovery(err)
        } else {
          console.error(err)
        }
        // this will retry immediately
        return caught$
      }
      return throwError(() => err)
    }),
  )
}

// Mirrors pair listener's initial snapshot event, but only for the resolved document id.
function createSnapshotEvent(
  documentId: string,
  document: null | SanityDocument,
): InitialSnapshotEvent {
  return {
    type: 'snapshot',
    documentId,
    document,
  }
}
