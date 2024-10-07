/* eslint-disable @typescript-eslint/no-use-before-define */
import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {groupBy} from 'lodash'
import {defer, merge, type Observable, of, throwError, timer} from 'rxjs'
import {catchError, concatMap, filter, map, mergeMap, scan, share} from 'rxjs/operators'

import {LISTENER_RESET_DELAY} from '../../../preview/constants'
import {shareReplayLatest} from '../../../preview/utils/shareReplayLatest'
import {debug} from './debug'
import {
  type IdPair,
  type MutationEvent,
  type PendingMutationsEvent,
  type ReconnectEvent,
  type WelcomeEvent,
} from './types'
import {OutOfSyncError, sequentializeListenerEvents} from './utils/sequentializeListenerEvents'

interface Snapshots {
  draft: SanityDocument | null
  published: SanityDocument | null
}

/** @internal */
export interface InitialSnapshotEvent {
  type: 'snapshot'
  documentId: string
  document: SanityDocument | null
}

/** @internal */
export interface PairListenerOptions {
  tag?: string

  /**
   * Called when we recover from sync error
   * Meant for error tracking / telemetry purposes
   * @param error - the {@link OutOfSyncError} recovered from
   */
  onSyncErrorRecovery?(error: OutOfSyncError): void
}

/** @internal */
export type ListenerEvent =
  | MutationEvent
  | ReconnectEvent
  | InitialSnapshotEvent
  | PendingMutationsEvent

const PENDING_START: PendingMutationsEvent = {type: 'pending', phase: 'begin'}
const PENDING_END: PendingMutationsEvent = {type: 'pending', phase: 'end'}

function isMutationEvent(msg: ListenerEvent): msg is MutationEvent {
  return msg.type === 'mutation'
}
function isMultiTransactionEvent(msg: MutationEvent) {
  return msg.transactionTotalEvents > 1
}

function allPendingTransactionEventsReceived(listenerEvents: ListenerEvent[]) {
  const groupedMutations = groupBy(
    listenerEvents.filter((ev): ev is MutationEvent => ev.type === 'mutation'),
    (e) => e.transactionId,
  )
  // Note: we can't assume that the events come in order, so instead of checking the counter attributes we check that we have actually received all
  return Object.values(groupedMutations).every(
    (mutations) => mutations.length === mutations[0].transactionTotalEvents,
  )
}

/** @internal */
export function getPairListener(
  client: SanityClient,
  idPair: IdPair,
  options: PairListenerOptions = {},
): Observable<ListenerEvent> {
  const {publishedId, draftId} = idPair

  const sharedEvents = defer(() =>
    client.observable
      .listen(
        `*[_id == $publishedId || _id == $draftId]`,
        {
          publishedId,
          draftId,
        },
        {
          includeResult: false,
          events: ['welcome', 'mutation', 'reconnect'],
          effectFormat: 'mendoza',
          tag: options.tag || 'document.pair-listener',
        },
      )
      .pipe(
        //filter((event) => Math.random() < 0.99 || event.type !== 'mutation'),
        shareReplayLatest({
          predicate: (event) => event.type === 'welcome' || event.type === 'reconnect',
          resetOnRefCountZero: () => timer(LISTENER_RESET_DELAY),
        }),
      ),
  ) as Observable<WelcomeEvent | MutationEvent | ReconnectEvent>

  const pairEvents$ = sharedEvents.pipe(
    concatMap((event) => {
      return event.type === 'welcome'
        ? fetchInitialDocumentSnapshots().pipe(
            mergeMap(({draft, published}) => [
              createSnapshotEvent(draftId, draft),
              createSnapshotEvent(publishedId, published),
            ]),
          )
        : of(event)
    }),
    scan(
      (
        acc: {
          next: (InitialSnapshotEvent | ListenerEvent)[]
          buffer: (InitialSnapshotEvent | ListenerEvent)[]
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

  const draftEvents$ = pairEvents$.pipe(
    filter((event) =>
      event.type === 'mutation' || event.type === 'snapshot' ? event.documentId === draftId : true,
    ),
    sequentializeListenerEvents(),
  )

  const publishedEvents$ = pairEvents$.pipe(
    filter((event) =>
      event.type === 'mutation' || event.type === 'snapshot'
        ? event.documentId === publishedId
        : true,
    ),
    sequentializeListenerEvents(),
  )

  return merge(draftEvents$, publishedEvents$).pipe(
    catchError((err, caught$) => {
      if (err instanceof OutOfSyncError) {
        debug('Recovering from OutOfSyncError: %s', OutOfSyncError.name)
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

  function fetchInitialDocumentSnapshots(): Observable<Snapshots> {
    return client.observable
      .getDocuments<SanityDocument>([draftId, publishedId], {tag: 'document.snapshots'})
      .pipe(
        map(([draft, published]) => ({
          draft,
          published,
        })),
      )
  }
}

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
