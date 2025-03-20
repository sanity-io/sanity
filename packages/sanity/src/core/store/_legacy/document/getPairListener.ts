/* eslint-disable @typescript-eslint/no-use-before-define */
import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {groupBy} from 'lodash'
import {defer, merge, type Observable, of, throwError} from 'rxjs'
import {catchError, concatMap, filter, map, mergeMap, scan, share} from 'rxjs/operators'

import {shareReplayLatest} from '../../../preview/utils/shareReplayLatest'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../../releases'
import {getVersionFromId} from '../../../util'
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
  version: SanityDocument | null
}

/** @internal */
export interface InitialSnapshotEvent {
  type: 'snapshot'
  documentId: string
  document: SanityDocument | null
}

/**
 * @internal
 */
export interface LatencyReportEvent {
  shard?: string
  latencyMs: number
  transactionId: string
}

/** @internal */
export interface DocumentStoreExtraOptions {
  tag?: string

  /**
   * Called when we recover from sync error
   * Meant for error tracking / telemetry purposes
   * @param error - the {@link OutOfSyncError} recovered from
   */
  onSyncErrorRecovery?(error: OutOfSyncError): void
  onReportLatency?: (event: LatencyReportEvent) => void
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
  _client: SanityClient,
  idPair: IdPair,
  options: DocumentStoreExtraOptions = {},
): Observable<ListenerEvent> {
  const {publishedId, draftId, versionId} = idPair
  const client = idPair.versionId ? _client.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS) : _client
  if (
    (idPair.versionId && getVersionFromId(idPair.versionId) === 'published') ||
    (idPair.versionId && getVersionFromId(idPair.versionId) === 'drafts')
  ) {
    throw new Error('VersionId cannot be "published" or "drafts"')
  }
  const sharedEvents = defer(() =>
    client.observable
      .listen(
        `*[_id in $ids]`,
        {
          ids: [publishedId, draftId, versionId].filter((id) => typeof id !== 'undefined'),
        },
        {
          includeResult: false,
          includeAllVersions: true,
          events: ['welcome', 'mutation', 'reconnect'],
          effectFormat: 'mendoza',
          tag: options.tag || 'document.pair-listener',
        },
      )
      .pipe(
        //filter((event) => Math.random() < 0.99 || event.type !== 'mutation'),
        shareReplayLatest({
          predicate: (event) => event.type === 'welcome' || event.type === 'reconnect',
        }),
      ),
  ) as Observable<WelcomeEvent | MutationEvent | ReconnectEvent>

  const pairEvents$ = sharedEvents.pipe(
    concatMap((event) => {
      return event.type === 'welcome'
        ? fetchInitialDocumentSnapshots().pipe(
            mergeMap(({draft, published, version}) => [
              createSnapshotEvent(draftId, draft),
              createSnapshotEvent(publishedId, published),
              ...(versionId ? [createSnapshotEvent(versionId, version)] : []),
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

  const versionEvents$ = pairEvents$.pipe(
    filter((event) =>
      event.type === 'mutation' || event.type === 'snapshot'
        ? event.documentId === versionId
        : true,
    ),
    sequentializeListenerEvents(),
  )

  return merge(draftEvents$, publishedEvents$, versionEvents$).pipe(
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
      .getDocuments<SanityDocument>(
        [publishedId, draftId, versionId].filter((id): id is string => typeof id === 'string'),
        {tag: 'document.snapshots'},
      )
      .pipe(
        map(([published, draft, version]) => ({
          draft,
          published,
          version,
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
