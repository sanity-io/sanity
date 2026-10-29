import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import groupBy from 'lodash-es/groupBy.js'
import {concat, defer, EMPTY, merge, type Observable, of, Subject, throwError} from 'rxjs'
import {catchError, concatMap, filter, map, mergeMap, scan, share, tap} from 'rxjs/operators'

import {shareReplayLatest} from '../../preview/utils/shareReplayLatest'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../releases/util/releasesClient'
import {isConnectionSessionError, isUnauthorizedError} from '../../util/apiErrors'
import {getVersionFromId} from '../../util/draftUtils'
import {type StoreRequestErrorHandler} from '../requestErrorHandler'
import {debug} from './debug'
import {
  type IdPair,
  type MutationEvent,
  type PendingMutationsEvent,
  type ReconnectEvent,
  type ResetEvent,
  type WelcomeBackEvent,
  type WelcomeEvent,
} from './types'
import {dedupeListenerEvents} from './utils/dedupeListenerEvents'
import {OutOfSyncError, sequentializeListenerEvents} from './utils/sequentializeListenerEvents'
import {
  type CommitAcknowledgement,
  type ListenerStallDetails,
  ListenerStalledError,
  watchForListenerStall,
} from './utils/watchForListenerStall'

/** See the 401 branch of the listener's `catchError`. */
const MAX_CREDENTIAL_CHECKS = 3

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
export interface DocumentPairLoadedEvent {
  durationMs: number
  fromCache: boolean
  hasPublished: boolean
  hasDraft: boolean
  hasVersion: boolean
}

/** @internal */
export interface MutationPerformanceEvent {
  transactionId: string
  debounceMs: number
  apiMs: number
  callbackMs: number
  shard?: string
}

/** @internal */
export interface DocumentRebaseTelemetryEvent {
  remoteMutationCount: number
  localMutationCount: number
}

/** @internal */
export interface CommitCancelledTelemetryEvent {
  /** The terminal HTTP status the commit failed with */
  statusCode: number
  /** The error type from the response body, e.g. `documentRevisionIDDoesNotMatchError` */
  errorType: string | undefined
}

/** @internal */
export interface CommitRetriesEndedTelemetryEvent {
  /** Time from the first failed attempt until the retries stopped being tracked */
  durationMs: number
  /** Failed attempts that were retried */
  failedAttempts: number
  /** Status code of the last failed attempt, undefined for network errors */
  lastStatusCode: number | undefined
  /**
   * - `succeeded`: a retry was accepted
   * - `cancelled`: a later attempt failed with a terminal status
   * - `reset`: a fresh snapshot returned the pair to a consistent state
   * - `torn-down`: the pair was torn down while still retrying
   */
  outcome: 'succeeded' | 'cancelled' | 'reset' | 'torn-down'
}

/** @internal */
export interface SyncErrorRecoveryTelemetryInfo {
  /** Whether local mutations were pending when the pair desynced */
  hadPendingMutations: boolean
}

/** @internal */
export interface DocumentStoreExtraOptions {
  tag?: string

  /**
   * Optional handler for failures of the initial document snapshot fetch —
   * the only request delegated here. Commit failures are routed through the
   * commit request's own failure/cancel channels, and listener drops
   * recover via reconnects. When omitted, fetch failures propagate to the
   * document event streams.
   */
  snapshotFetchErrorHandler?: StoreRequestErrorHandler

  /**
   * Called when we recover from sync error
   * Meant for error tracking / telemetry purposes
   * @param error - the {@link OutOfSyncError} recovered from
   * @param info - whether local mutations were pending at that moment, passed when the listener
   * belongs to a checked out pair
   */
  onSyncErrorRecovery?(error: OutOfSyncError, info?: SyncErrorRecoveryTelemetryInfo): void
  /**
   * Called when saved changes weren't echoed by the listener in time and the
   * listener is restarted. Meant for error tracking / telemetry purposes
   */
  onListenerStall?(details: ListenerStallDetails): void
  onReportLatency?: (event: LatencyReportEvent) => void
  onSlowCommit?: () => void
  onDocumentPairLoaded?: (event: DocumentPairLoadedEvent) => void
  onReportMutationPerformance?: (event: MutationPerformanceEvent) => void
  onDocumentRebase?: (event: DocumentRebaseTelemetryEvent) => void
  /** Called when a commit fails with a terminal status and its buffered mutations are reset */
  onCommitCancelled?: (event: CommitCancelledTelemetryEvent) => void
  /** Called once when a commit that was being retried with backoff stops being tracked */
  onCommitRetriesEnded?: (event: CommitRetriesEndedTelemetryEvent) => void
  /** Called when a pair is torn down while local mutations are pending */
  onPairTornDownWithPendingMutations?: () => void
}

/** @internal */
export type ListenerEvent =
  | MutationEvent
  | ReconnectEvent
  | InitialSnapshotEvent
  | PendingMutationsEvent
  | WelcomeEvent
  | WelcomeBackEvent
  | ResetEvent

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
  options: DocumentStoreExtraOptions & {
    commitAcknowledged$?: Observable<CommitAcknowledgement>
  } = {},
): Observable<ListenerEvent> {
  const {publishedId, draftId, versionId} = idPair
  const client = idPair.versionId ? _client.withConfig(RELEASES_STUDIO_CLIENT_OPTIONS) : _client
  if (
    (idPair.versionId && getVersionFromId(idPair.versionId) === 'published') ||
    (idPair.versionId && getVersionFromId(idPair.versionId) === 'drafts')
  ) {
    throw new Error('VersionId cannot be "published" or "drafts"')
  }
  // 401s in a row on the listener, each followed by a credential check and a reconnect. A welcome
  // resets it. Each check renews at most once through the auth store, so a session that is
  // really over ends the retries by itself; the bound covers a server that keeps refusing a
  // credential the store keeps accepting.
  let credentialChecks = 0

  const sharedEvents = defer(() =>
    (
      client.observable.listen(
        `*[_id in $ids]`,
        {
          ids: [publishedId, draftId, versionId].filter((id) => typeof id !== 'undefined'),
        },
        {
          includeResult: false,
          includeAllVersions: true,
          enableResume: true,
          events: ['welcome', 'mutation', 'reconnect', 'reset', 'welcomeback'],
          effectFormat: 'mendoza',
          tag: options.tag || 'document.pair.listen',
        },
      ) as Observable<WelcomeEvent | MutationEvent | ReconnectEvent | WelcomeBackEvent | ResetEvent>
    ).pipe(
      tap((event) => {
        if (event.type === 'welcome' || event.type === 'welcomeback') credentialChecks = 0
      }),
      dedupeListenerEvents(),
      map((event): WelcomeEvent | MutationEvent | ReconnectEvent | WelcomeBackEvent | ResetEvent =>
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

  const serverEvents$ = new Subject<ListenerEvent>()
  const pairEvents$ = sharedEvents.pipe(
    tap((event) => serverEvents$.next(event)),
    concatMap((event) => {
      const shouldSyncDocument =
        event.type === 'reset' ||
        // note: resumability may not be enabled – if so, treat welcome the same way as a reset
        event.type === 'welcome'
      return shouldSyncDocument
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

  const deliveredEvents$ = merge(draftEvents$, publishedEvents$, versionEvents$)
  const {commitAcknowledged$} = options
  const watchedEvents$ = commitAcknowledged$
    ? deliveredEvents$.pipe(watchForListenerStall({serverEvents$, commitAcknowledged$}))
    : deliveredEvents$

  return watchedEvents$.pipe(
    catchError((err, caught$) => {
      if (err instanceof ListenerStalledError) {
        debug('Restarting stalled listener')
        options.onListenerStall?.(err.details)
        return caught$
      }

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

      // The listener's credential was refused, usually a token a renewal just replaced. One
      // request through the client lets the auth store renew it or end the session; then
      // reconnect. If that fails, complete (an errored stream crashes the tool).
      if (isConnectionSessionError(err)) {
        credentialChecks += 1
        if (credentialChecks > MAX_CREDENTIAL_CHECKS) {
          debug('Listener connection rejected (HTTP 401) %d times, giving up', credentialChecks - 1)
          return EMPTY
        }
        debug(
          'Listener connection rejected (HTTP 401), checking the credential before reconnecting',
        )
        return concat(
          of({type: 'reconnect'} as ReconnectEvent),
          client.observable.request({url: '/users/me', tag: 'document.pair.reauthorize'}).pipe(
            // Only the check: errors from the reconnected listener take the usual paths above.
            catchError((checkError: unknown) => {
              const message = checkError instanceof Error ? checkError.message : checkError
              // Only a rejected credential ends the listener. Any other failure (network, timeout,
              // 5xx) says nothing about the credential, so reconnect anyway; the limit above still
              // applies if the listener keeps rejecting it.
              if (isUnauthorizedError(checkError) || isConnectionSessionError(checkError)) {
                debug('Listener credential could not be restored, terminating: %s', message)
                return EMPTY
              }
              debug('Listener credential check failed, reconnecting anyway: %s', message)
              return of(undefined)
            }),
            mergeMap(() => caught$),
          ),
        )
      }

      return throwError(() => err)
    }),
  )

  function fetchInitialDocumentSnapshots(): Observable<Snapshots> {
    const fetchDocuments = () =>
      client.observable.getDocuments<SanityDocument>(
        [publishedId, draftId, versionId].filter((id): id is string => typeof id === 'string'),
        {tag: 'document.pair.fetch'},
      )

    // The pair cannot load without these snapshots, and there is no local
    // recovery if the fetch fails — delegate failures to the error handler
    // when one is provided. Retryable: it's an idempotent GET, safe to
    // re-run.
    //
    // While the handler holds a failed fetch for re-run, `pairEvents$`
    // buffers subsequent listener events behind this observable (concatMap)
    // on purpose: they must chain onto the snapshot once it arrives.
    // The buffer stays small — the listener only carries events for this
    // pair's documents — and tearing down the pair drops it.
    return defer(() =>
      options.snapshotFetchErrorHandler
        ? options.snapshotFetchErrorHandler.attempt(fetchDocuments, {retryable: true})
        : fetchDocuments(),
    ).pipe(
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
