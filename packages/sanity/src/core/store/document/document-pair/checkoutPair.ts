import {
  type Action,
  type MultipleActionResult,
  type SanityClient,
  type SingleMutationResult,
} from '@sanity/client'
import {type Mutation} from '@sanity/mutator'
import {type SanityDocument} from '@sanity/types'
import omit from 'lodash-es/omit.js'
import {defer, EMPTY, from, merge, type Observable, timer} from 'rxjs'
import {
  filter,
  map,
  mergeMap,
  scan,
  share,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators'

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
 * @hidden
 * @beta */
export type Pair = {
  /** @internal */
  transactionsPendingEvents$: Observable<PendingMutationsEvent>
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

function submitCommitRequest(
  client: SanityClient,
  idPair: IdPair,
  request: CommitRequest,
  serverActionsEnabled: boolean,
): Observable<MultipleActionResult | MutationResult> {
  return from(
    serverActionsEnabled
      ? commitActions(client, idPair, request.mutation.params)
      : commitMutations(client, idPair, request.mutation.params),
  ).pipe(
    tap({
      error: (error) => {
        const isBadRequest =
          'statusCode' in error &&
          typeof error.statusCode === 'number' &&
          error.statusCode >= 400 &&
          error.statusCode <= 500
        if (isBadRequest) {
          request.cancel(error)
        } else {
          request.failure(error)
        }
      },
      next: () => request.success(),
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
  serverActionsEnabled: Observable<boolean>,
  options: DocumentStoreExtraOptions = {},
): Pair {
  const {publishedId, draftId, versionId} = idPair

  const {
    onReportLatency,
    onSyncErrorRecovery,
    onSlowCommit,
    onReportMutationPerformance,
    onDocumentRebase,
    tag,
  } = options

  const listenerEvents$ = getPairListener(client, idPair, {onSyncErrorRecovery, tag}).pipe(share())

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

  const commits$ = commitRequests$.pipe(
    mergeMap((commitRequest) =>
      serverActionsEnabled.pipe(
        take(1),
        mergeMap((canUseServerActions) => {
          const apiRequestSentAt = Date.now()
          return submitCommitRequest(client, idPair, commitRequest, canUseServerActions).pipe(
            map((result) => ({
              ...result,
              _perfTimings: {
                firstMutationReceivedAt: commitRequest.firstMutationReceivedAt,
                apiRequestSentAt,
                apiResponseReceivedAt: Date.now(),
              },
            })),
          )
        }),
      ),
    ),
    share(),
  )

  const pendingEnd$ = transactionsPendingEvents$.pipe(filter((ev) => ev.phase === 'end'))
  const commitResolved$ = merge(pendingEnd$, commits$)

  // Each new commit request restarts the timer via switchMap.
  // The timer is cancelled when the commit succeeds or pending mutations resolve.
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
    ),
  ).pipe(
    mergeMap(() => EMPTY),
    share(),
  )

  return {
    transactionsPendingEvents$,
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
      .then((response) => {
        const shard = response.headers.get('X-Sanity-Shard') || undefined
        // Cancel the body stream to free the underlying HTTP connection.
        // Without this, the unconsumed body keeps the H2/H3 stream open,
        // which can cause head-of-line blocking on multiplexed connections.
        void response.body?.cancel()
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
