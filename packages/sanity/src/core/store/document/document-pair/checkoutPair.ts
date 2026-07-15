import {
  type Action,
  type MultipleActionResult,
  type SanityClient,
  type SingleMutationResult,
} from '@sanity/client'
import {type Mutation} from '@sanity/mutator'
import {type SanityDocument} from '@sanity/types'
import omit from 'lodash-es/omit.js'
import {combineLatest, defer, EMPTY, from, merge, type Observable, of, timer} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  scan,
  share,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators'

import {isInvalidSessionError} from '../../../util/apiErrors'
import {type DocumentVariantType} from '../../../util/getDocumentVariantType'
import {
  type BufferedDocumentEvent,
  type CommitRequest,
  createBufferedDocument,
  type DocumentRebaseEvent,
  type MutationPayload,
  type RemoteSnapshotEvent,
} from '../buffered-doc'
import {
  type DocumentStoreExtraOptions,
  getPairListener,
  type InitialSnapshotEvent,
  type LatencyReportEvent,
  type ListenerEvent,
  type MutationPerformanceEvent,
} from '../getPairListener'
import {
  type IdPair,
  type MutationEvent,
  type PendingMutationsEvent,
  type ReconnectEvent,
  type ResetEvent,
  type WelcomeBackEvent,
  type WelcomeEvent,
} from '../types'
import {actionsApiClient} from './utils/actionsApiClient'
import {operationsApiClient} from './utils/operationsApiClient'

/** Timeout on request that fetches shard name before reporting latency */
const FETCH_SHARD_TIMEOUT = 20_000

/** TTL for unmatched entries in the latency tracking pending array */
const PENDING_ENTRY_TTL = 60_000

/** Duration after which a commit is considered slow and a warning is surfaced to the user */
const SLOW_COMMIT_TIMEOUT_MS = 50_000

const isMutationEventForDocId =
  (id: string) =>
  (event: ListenerEvent): event is MutationEvent | InitialSnapshotEvent => {
    return (event.type === 'snapshot' || event.type === 'mutation') && event.documentId === id
  }

/**
 * @hidden
 * @beta */
export type WithVersion<T> = T & {version: DocumentVariantType}

/**
 * @hidden
 * @beta */
export type DocumentVersionEvent = WithVersion<
  ReconnectEvent | BufferedDocumentEvent | WelcomeEvent | WelcomeBackEvent | ResetEvent
>

/**
 * @hidden
 * @beta */
export type RemoteSnapshotVersionEvent = WithVersion<RemoteSnapshotEvent>

/**
 * @hidden
 * @beta
 * The SingleMutationResult type from `@sanity/client` doesn't reflect what we get back from POST /mutate
 */
export type MutationResult = Omit<SingleMutationResult, 'documentId'>

/**
 * @hidden
 * @beta */
export interface DocumentVersion {
  consistency$: Observable<boolean>
  remoteSnapshot$: Observable<RemoteSnapshotVersionEvent>
  events: Observable<DocumentVersionEvent>

  patch: (patches: any[]) => MutationPayload[]
  create: (document: Partial<SanityDocument>) => MutationPayload
  createIfNotExists: (document: SanityDocument) => MutationPayload
  createOrReplace: (document: SanityDocument) => MutationPayload
  delete: () => MutationPayload

  mutate: (mutations: MutationPayload[]) => void
  commit: () => void
}

/**
 * The error thrown by the most recent failed commit attempt. Wrapped in an
 * object (rather than emitted raw) because a commit can reject with any
 * thrown value — including `undefined`, which would otherwise be
 * indistinguishable from the healthy state.
 *
 * @internal
 */
export type CommitError = {error: unknown}

/**
 * @hidden
 * @beta */
export type Pair = {
  /** @internal */
  transactionsPendingEvents$: Observable<PendingMutationsEvent>
  /**
   * The error from the most recent commit attempt while it failed and is
   * being retried by the mutator, or `undefined` while commits are healthy.
   * Resets to `undefined` on the next successful (or terminally cancelled)
   * commit, and when the pair returns to a consistent state — i.e. the
   * buffered edits the failure was about no longer exist. Distinguishes
   * "commits are failing" from "the backlog is merely slow" — see
   * `useDocumentSyncState`.
   * @internal
   */
  commitError$: Observable<CommitError | undefined>
  published: DocumentVersion
  draft: DocumentVersion
  version?: DocumentVersion
}

function setVersion<T>(version: 'draft' | 'published' | 'version') {
  return (ev: T): T & {version: 'draft' | 'published' | 'version'} => ({...ev, version})
}

function requireId<T extends {_id?: string; _type: string}>(
  value: T,
): asserts value is T & {_id: string} {
  if (!value._id) {
    throw new Error('Expected document to have an _id')
  }
}

//if we're patching a published document directly
//then we're live editing and we should use raw mutations
//rather than actions
function isLiveEditMutation(mutationParams: Mutation['params'], publishedId: string) {
  const {resultRev, ...mutation} = mutationParams
  const patchTargets: string[] = mutation.mutations.flatMap((mut) => {
    const mutationPayloads = Object.values(mut)
    if (mutationPayloads.length > 1) {
      throw new Error('Did not expect multiple mutations in the same payload')
    }
    return mutationPayloads[0].id || mutationPayloads[0]._id
  })
  return patchTargets.every((target) => target === publishedId)
}

function toActions(idPair: IdPair, mutationParams: Mutation['params']): Action[] {
  const actions = mutationParams.mutations.flatMap<Action>((mutations) => {
    // This action is not always interoperable with the equivalent mutation. It will fail if the
    // published version of the document already exists.
    if (mutations.createIfNotExists) {
      // ignore all createIfNotExists, as these should be covered by the actions api and only be done locally
      return []
    }
    if (mutations.create) {
      // the actions API requires attributes._id to be set, while it's optional in the mutation API
      requireId(mutations.create)
      return {
        actionType: 'sanity.action.document.create',
        publishedId: idPair.publishedId,
        attributes: mutations.create,
        ifExists: 'fail',
      }
    }
    if (mutations.patch) {
      return {
        actionType: 'sanity.action.document.edit',
        draftId: idPair.versionId ?? idPair.draftId,
        publishedId: idPair.publishedId,
        patch: omit(mutations.patch, 'id'),
      }
    }
    throw new Error('Cannot map mutation to action')
  })

  // Empty action invocations are a noop; although Content Lake accepts them, no transaction will
  // be executed, causing Studio to become stuck in a pending state. To prevent this occurring, a
  // fake unset mutation is added whenever an empty set of actions would otherwise be executed.
  if (actions.length === 0) {
    return [
      {
        actionType: 'sanity.action.document.edit',
        draftId: idPair.draftId,
        publishedId: idPair.publishedId,
        patch: {
          unset: ['_empty_action_guard_pseudo_field_'],
        },
      },
    ]
  }

  return actions
}

function commitActions(client: SanityClient, idPair: IdPair, mutationParams: Mutation['params']) {
  if (isLiveEditMutation(mutationParams, idPair.publishedId)) {
    return commitMutations(client, idPair, mutationParams)
  }

  return actionsApiClient(client, idPair).observable.action(toActions(idPair, mutationParams), {
    tag: 'document.commit',
    transactionId: mutationParams.transactionId,
  })
}

function commitMutations(
  client: SanityClient,
  idPair: IdPair,
  mutationParams: Mutation['params'],
): Promise<MutationResult> {
  const {resultRev, ...mutation} = mutationParams
  return operationsApiClient(client, idPair).dataRequest('mutate', mutation, {
    visibility: 'async',
    returnDocuments: false,
    tag: 'document.commit',
    // This makes sure the studio doesn't crash when a draft is crated
    // because someone deleted a referenced document in the target dataset
    skipCrossDatasetReferenceValidation: true,
  })
}

/**
 * The 4xx statuses we positively know are terminal for a commit: resubmitting
 * the same mutation can never succeed, so the buffered edits are cancelled
 * (rejected + reset to server HEAD) instead of retried. Opt-in by explicit
 * status rather than a blanket 4xx rule, because the buckets have opposite
 * failure modes: wrongly retrying a terminal error leaves the document
 * visibly stalled with the edits preserved (recoverable), while wrongly
 * cancelling a transient error silently destroys the user's work. Statuses
 * not listed here — including transient 4xx like 408/429 and any 4xx we
 * haven't classified — take the conservative retry path.
 *
 * 401 is terminal only for resource-level denials (e.g. a missing grant —
 * some endpoints answer those with 401, not 403). A 401 tagged as an invalid
 * session (`SIO-401-AEX` expired, `SIO-401-ANF` not found) is carved out
 * below: it says nothing about the mutation itself, and re-authenticating
 * can make the retry succeed, so the buffered edits must be preserved
 * rather than wiped mid-edit. The session itself is handled separately by
 * the force-logout flow.
 */
const TERMINAL_COMMIT_STATUSES = new Set([400, 401, 402, 403, 404, 409, 410, 412, 413, 422])

/**
 * The result of a single commit attempt. Failures are routed to the mutator
 * (`request.failure` → retry with backoff, `request.cancel` → terminal
 * reset) *before* being emitted here, so this stream doubles as a
 * side-channel for observing commit health without erroring the document
 * event streams.
 */
type CommitAttemptResult =
  | {
      type: 'success'
      result: (MultipleActionResult | MutationResult) & {_perfTimings?: PerfTimings}
    }
  | {type: 'failure'; error: unknown}
  | {type: 'cancel'; error: unknown}

function submitCommitRequest(
  client: SanityClient,
  idPair: IdPair,
  request: CommitRequest,
): Observable<CommitAttemptResult> {
  return from(commitActions(client, idPair, request.mutation.params)).pipe(
    tap({
      next: () => request.success(),
    }),
    map((result): CommitAttemptResult => ({type: 'success', result})),
    // A failed commit is reported to the mutator via `request.cancel` /
    // `request.failure` (which rejects the corresponding commit promise so
    // the buffered document can retry/rebase on reconnect). After that, we
    // must NOT let the error propagate down this observable: it feeds
    // `commits$` → `combinedEvents` → the document `events` stream, and an
    // errored events stream is rethrown by `useObservable` (react-rx) when
    // `useEditState` reads it during render, crashing the document pane.
    // Emit the attempt result as a value instead — the failure has already
    // been routed through its proper channel.
    catchError((error) => {
      // A known-terminal client error cancels: the buffered mutations can't
      // succeed by retrying, so the commit is rejected and the buffer reset
      // to server HEAD (see TERMINAL_COMMIT_STATUSES for the rationale).
      // Everything else — 5xx, transient 4xx (408/429), unclassified 4xx,
      // session-expiry 401s, network errors — fails, so the mutator keeps
      // the buffer and retries with backoff.
      // `error` can be any thrown value — guard before using `in`, which
      // throws on primitives.
      const statusCode =
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        typeof error.statusCode === 'number'
          ? error.statusCode
          : undefined
      if (
        statusCode !== undefined &&
        TERMINAL_COMMIT_STATUSES.has(statusCode) &&
        !isInvalidSessionError(error)
      ) {
        request.cancel(error)
        return of<CommitAttemptResult>({type: 'cancel', error})
      }
      request.failure(error)
      return of<CommitAttemptResult>({type: 'failure', error})
    }),
  )
}

type PerfTimings = {
  firstMutationReceivedAt?: number
  apiRequestSentAt: number
  apiResponseReceivedAt: number
}

type LatencyTrackingEvent = {
  transactionId: string
  submittedAt: Date
  receivedAt: Date
  deltaMs: number
  perfTimings?: PerfTimings
}

type LatencyTrackingPendingEntry =
  | {type: 'submit'; transactionId: string; timestamp: Date; perfTimings?: PerfTimings}
  | {type: 'receive'; transactionId: string; timestamp: Date}

type LatencyTrackingEntry = LatencyTrackingPendingEntry | {type: 'reset'}

type LatencyTrackingState = {
  pending: LatencyTrackingPendingEntry[]
  event: LatencyTrackingEvent | undefined
}

/** @internal */
export function checkoutPair(
  client: SanityClient,
  idPair: IdPair,
  /**
   * @deprecated does nothing Preserved to avoid breaking changes
   * Will be removed in the next major version.
   */
  _serverActionsEnabled: Observable<boolean> | undefined,
  options: DocumentStoreExtraOptions = {},
): Pair {
  const {publishedId, draftId, versionId} = idPair

  const {
    onReportLatency,
    onSyncErrorRecovery,
    onSlowCommit,
    onReportMutationPerformance,
    onDocumentRebase,
    snapshotFetchErrorHandler,
    tag,
  } = options

  const listenerEvents$ = getPairListener(client, idPair, {
    onSyncErrorRecovery,
    tag,
    snapshotFetchErrorHandler,
  }).pipe(share())

  const connectionChangeEvents$ = listenerEvents$.pipe(
    filter((ev) => ev.type === 'reconnect' || ev.type === 'welcome' || ev.type === 'welcomeback'),
  )

  const draft = createBufferedDocument(
    draftId,
    listenerEvents$.pipe(filter(isMutationEventForDocId(draftId))),
  )

  const version =
    typeof versionId === 'undefined'
      ? undefined
      : createBufferedDocument(
          versionId,
          listenerEvents$.pipe(filter(isMutationEventForDocId(versionId))),
        )

  const published = createBufferedDocument(
    publishedId,
    listenerEvents$.pipe(filter(isMutationEventForDocId(publishedId))),
  )

  // share commit handling between draft and published
  const transactionsPendingEvents$ = listenerEvents$.pipe(
    filter((ev): ev is PendingMutationsEvent => ev.type === 'pending'),
  )

  const commitRequests$ = merge(
    draft.commitRequest$,
    published.commitRequest$,
    version ? version.commitRequest$ : EMPTY,
  ).pipe(share())

  const commitAttemptResults$ = commitRequests$.pipe(
    mergeMap((commitRequest) => {
      const apiRequestSentAt = Date.now()
      return submitCommitRequest(client, idPair, commitRequest).pipe(
        map(
          (attemptResult): CommitAttemptResult =>
            attemptResult.type === 'success'
              ? {
                  ...attemptResult,
                  result: {
                    ...attemptResult.result,
                    _perfTimings: {
                      firstMutationReceivedAt: commitRequest.firstMutationReceivedAt,
                      apiRequestSentAt,
                      apiResponseReceivedAt: Date.now(),
                    },
                  },
                }
              : attemptResult,
        ),
      )
    }),
    share(),
  )

  // The successful commits — failures/cancels have already been routed to the
  // mutator and must not reach the document event streams (see
  // `submitCommitRequest`).
  const commits$ = commitAttemptResults$.pipe(
    filter(
      (attemptResult): attemptResult is Extract<CommitAttemptResult, {type: 'success'}> =>
        attemptResult.type === 'success',
    ),
    map((attemptResult) => attemptResult.result),
    share(),
  )

  // Whether every buffered document in the pair is free of pending local
  // mutations — the pair-level version of the per-document `consistency$`.
  const consistent$ = combineLatest([
    draft.consistency$,
    published.consistency$,
    version ? version.consistency$ : of(true),
  ]).pipe(
    map((states) => states.every(Boolean)),
    distinctUntilChanged(),
  )

  // The error from the most recent commit attempt while the mutator is
  // retrying it on backoff, `undefined` while commits are healthy. Multicast
  // with replay so late subscribers (the sync-state hook mounts after the
  // pair is checked out) see the current value, not just future attempt
  // results — the silenced merge into `combinedEvents` below keeps it
  // recording for the pair's lifetime.
  const commitError$ = merge(
    commitAttemptResults$.pipe(
      map((attemptResult): CommitError | undefined =>
        attemptResult.type === 'failure' ? {error: attemptResult.error} : undefined,
      ),
    ),
    // Returning to consistency means the buffered edits the failure was
    // about are gone — drained, discarded, or reset to server HEAD by a
    // fresh snapshot — so nothing is being retried anymore. Note this is
    // deliberately NOT keyed on listener reconnects (welcome/welcome-back):
    // a live listener says nothing about commit health, and a reconnect
    // while still unsynced must not mask an ongoing failure.
    consistent$.pipe(
      filter((isConsistent) => isConsistent),
      map(() => undefined),
    ),
  ).pipe(startWith(undefined), distinctUntilChanged(), shareReplay({bufferSize: 1, refCount: true}))

  const pendingEnd$ = transactionsPendingEvents$.pipe(filter((ev) => ev.phase === 'end'))
  const commitResolved$ = merge(pendingEnd$, commits$)

  // Each new commit request restarts the timer via switchMap.
  // The timer is cancelled when the commit succeeds or pending mutations resolve.
  // Note: a *failed* commit does not emit on `commits$` (failures are filtered
  // out of `commitAttemptResults$` above), so `commitResolved$` does not fire for
  // it — a commit that fails after SLOW_COMMIT_TIMEOUT_MS still triggers
  // `onSlowCommit`. That's intentional: it was slow, and it's now failing.
  const slowCommitWarning$ = onSlowCommit
    ? commitRequests$.pipe(
        switchMap(() => timer(SLOW_COMMIT_TIMEOUT_MS).pipe(takeUntil(commitResolved$))),
        tap(() => onSlowCommit()),
      )
    : EMPTY

  const rebaseEvents$ = onDocumentRebase
    ? merge(draft.events, published.events, ...(version ? [version.events] : [])).pipe(
        filter((ev): ev is DocumentRebaseEvent & {type: 'rebase'} => ev.type === 'rebase'),
        tap((ev) => {
          try {
            onDocumentRebase({
              remoteMutationCount: ev.remoteMutations.length,
              localMutationCount: ev.localMutations.length,
            })
          } catch {
            // Telemetry callbacks must never kill the document pipeline
          }
        }),
      )
    : EMPTY

  // Note: we're only subscribing to this for the side-effect
  const combinedEvents = defer(() =>
    merge(
      onReportLatency || onReportMutationPerformance
        ? reportLatency({
            commits$: commits$,
            listenerEvents$: listenerEvents$,
            client,
            onReportLatency,
            onReportMutationPerformance,
          })
        : merge(commits$, listenerEvents$),
      slowCommitWarning$,
      rebaseEvents$,
      commitError$,
    ),
  ).pipe(
    mergeMap(() => EMPTY),
    share(),
  )

  return {
    transactionsPendingEvents$,
    commitError$,
    draft: {
      ...draft,
      events: merge(combinedEvents, connectionChangeEvents$, draft.events).pipe(
        map(setVersion('draft')),
      ),
      remoteSnapshot$: draft.remoteSnapshot$.pipe(map(setVersion('draft'))),
    },
    ...(typeof version === 'undefined'
      ? {}
      : {
          version: {
            ...version,
            events: merge(combinedEvents, connectionChangeEvents$, version.events).pipe(
              map(setVersion('version')),
            ),
            remoteSnapshot$: version.remoteSnapshot$.pipe(map(setVersion('version'))),
          },
        }),
    published: {
      ...published,
      events: merge(combinedEvents, connectionChangeEvents$, published.events).pipe(
        map(setVersion('published')),
      ),
      remoteSnapshot$: published.remoteSnapshot$.pipe(map(setVersion('published'))),
    },
  }
}

function reportLatency(options: {
  commits$: Observable<(MultipleActionResult | MutationResult) & {_perfTimings?: PerfTimings}>
  listenerEvents$: Observable<ListenerEvent>
  client: SanityClient
  onReportLatency?: (event: LatencyReportEvent) => void
  onReportMutationPerformance?: (event: MutationPerformanceEvent) => void
}) {
  const {client, commits$, listenerEvents$, onReportLatency, onReportMutationPerformance} = options
  // Note: this request happens once and the result is then cached indefinitely
  let shardInfo: Promise<string | undefined>
  try {
    shardInfo = fetch(client.getUrl(client.getDataUrl('ping')), {
      signal: AbortSignal.timeout(FETCH_SHARD_TIMEOUT),
    })
      .then(async (response) => {
        const shard = response.headers.get('X-Sanity-Shard') || undefined

        // The ping response is tiny; consuming it lets the browser finish the
        // H2/H3 stream cleanly and avoids long pending receive/cancel timing.
        await response.arrayBuffer().catch(() => undefined)
        return shard
      })
      .catch(() => undefined)
  } catch {
    shardInfo = Promise.resolve(undefined)
  }

  const submittedMutations = commits$.pipe(
    map(
      (ev): LatencyTrackingEntry => ({
        type: 'submit' as const,
        transactionId: ev.transactionId,
        timestamp: new Date(),
        perfTimings: ev._perfTimings,
      }),
    ),
    share(),
  )

  const receivedMutations = listenerEvents$.pipe(
    filter((ev) => ev.type === 'mutation'),
    map(
      (ev): LatencyTrackingEntry => ({
        type: 'receive' as const,
        transactionId: ev.transactionId,
        timestamp: new Date(),
      }),
    ),
    share(),
  )

  // Clear pending entries on reconnection to avoid matching stale pre-reconnect
  // submit entries with post-reconnect listener events (which would produce
  // wildly inaccurate latency measurements).
  const reconnectionResets = listenerEvents$.pipe(
    filter((ev) => ev.type === 'reconnect' || ev.type === 'welcome' || ev.type === 'welcomeback'),
    map((): LatencyTrackingEntry => ({type: 'reset'})),
  )

  return merge(submittedMutations, receivedMutations, reconnectionResets).pipe(
    scan(
      (state: LatencyTrackingState, event): LatencyTrackingState => {
        if (event.type === 'reset') {
          return {event: undefined, pending: []}
        }

        // Evict stale entries to prevent unbounded growth from remote/duplicate mutations
        const now = Date.now()
        const pending = state.pending.filter((e) => now - e.timestamp.getTime() < PENDING_ENTRY_TTL)

        const matchingIndex = pending.findIndex(
          (e) => e.transactionId === event.transactionId && e.type !== event.type,
        )
        if (matchingIndex > -1) {
          const matching = pending[matchingIndex]
          const [submitEvent, receiveEvent] =
            matching.type === 'submit' ? [matching, event] : [event, matching]
          return {
            event: {
              transactionId: event.transactionId,
              submittedAt: submitEvent.timestamp,
              receivedAt: receiveEvent.timestamp,
              deltaMs: receiveEvent.timestamp.getTime() - submitEvent.timestamp.getTime(),
              perfTimings: submitEvent.type === 'submit' ? submitEvent.perfTimings : undefined,
            },
            // Remove the matched entry and any other entries with the same transactionId
            // (e.g., duplicate receive events from multi-document transactions)
            pending: pending.filter(
              (e, i) => i !== matchingIndex && e.transactionId !== event.transactionId,
            ),
          }
        }
        return {event: undefined, pending: pending.concat(event)}
      },
      {event: undefined, pending: []},
    ),
    map((state) => state.event),
    filter((event) => !!event),
    withLatestFrom(from(shardInfo).pipe(startWith(undefined))),
    tap(([event, shard]) => {
      try {
        onReportLatency?.({latencyMs: event.deltaMs, shard, transactionId: event.transactionId})
      } catch {
        // Telemetry callbacks must never kill the document pipeline
      }

      if (onReportMutationPerformance && event.perfTimings) {
        const {firstMutationReceivedAt, apiRequestSentAt, apiResponseReceivedAt} = event.perfTimings
        const listenerReceivedAt = event.receivedAt.getTime()

        if (firstMutationReceivedAt !== undefined) {
          try {
            onReportMutationPerformance({
              transactionId: event.transactionId,
              debounceMs: Math.max(0, apiRequestSentAt - firstMutationReceivedAt),
              apiMs: Math.max(0, apiResponseReceivedAt - apiRequestSentAt),
              // Listener and API response race each other — both are triggered
              // server-side after the mutation is committed. Measure callback from
              // when the request was sent, not when the HTTP response arrived.
              callbackMs: Math.max(0, listenerReceivedAt - apiRequestSentAt),
              shard,
            })
          } catch {
            // Telemetry callbacks must never kill the document pipeline
          }
        }
      }
    }),
  )
}
