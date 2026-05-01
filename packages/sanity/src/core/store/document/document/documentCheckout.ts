import {
  type Action,
  type MultipleActionResult,
  type SanityClient,
  type SingleMutationResult,
} from '@sanity/client'
import {getPublishedId} from '@sanity/client/csm'
import {type Mutation} from '@sanity/mutator'
import omit from 'lodash-es/omit.js'
import {
  defer,
  EMPTY,
  filter,
  from,
  map,
  merge,
  mergeMap,
  share,
  switchMap,
  take,
  takeUntil,
  tap,
  timer,
  type Observable,
} from 'rxjs'

import {getDocumentVariantType} from '../../../util/getDocumentVariantType'
import {createBufferedDocument} from '../buffered-doc/createBufferedDocument'
import {type CommitRequest} from '../buffered-doc/createObservableBufferedDocument'
import {type DocumentRebaseEvent} from '../buffered-doc/types'
import {
  reportLatency,
  type DocumentVersion,
  SLOW_COMMIT_TIMEOUT_MS,
} from '../document-pair/checkoutPair'
import {type DocumentStoreExtraOptions} from '../getPairListener'
import {type PendingMutationsEvent} from '../types'
import {getDocumentListener} from './getDocumentListener'

// Keeps the document-scoped action path honest: server actions need a concrete id,
// while mutation payloads can technically omit it.
function requireId<T extends {_id?: string; _type: string}>(
  value: T,
): asserts value is T & {_id: string} {
  if (!value._id) {
    throw new Error('Expected document to have an _id')
  }
}

// Single-document version of the pair action mapper: every mutation is scoped to the
// resolved document id instead of choosing between draft/published/version branches.
function toActions(documentId: string, mutationParams: Mutation['params']): Action[] {
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
        publishedId: getPublishedId(documentId),
        attributes: mutations.create,
        ifExists: 'fail',
      }
    }
    if (mutations.patch) {
      return {
        actionType: 'sanity.action.document.edit',
        draftId: documentId,
        publishedId: getPublishedId(documentId),
        patch: omit(mutations.patch, 'id'),
      }
    }
    throw new Error('Cannot map mutation to action')
  })
  // TODO: Can we handle this in other way? Maybe avoid the empty action if no actions are needed?

  // Empty action invocations are a noop; although Content Lake accepts them, no transaction will
  // be executed, causing Studio to become stuck in a pending state. To prevent this occurring, a
  // fake unset mutation is added whenever an empty set of actions would otherwise be executed.
  if (actions.length === 0) {
    return [
      {
        actionType: 'sanity.action.document.edit',
        draftId: documentId,
        publishedId: getPublishedId(documentId),
        patch: {
          unset: ['_empty_action_guard_pseudo_field_'],
        },
      },
    ]
  }
  return actions
}

// Keeps the single-document path aligned with pair checkout: published live-edit writes
// still use raw mutations instead of the draft-oriented actions API.
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

// Raw mutation path kept for live edit and clients without server actions, matching pair checkout.
function commitMutations(
  client: SanityClient,
  mutationParams: Mutation['params'],
): Promise<SingleMutationResult> {
  const {resultRev, ...mutation} = mutationParams
  return client.dataRequest('mutate', mutation, {
    visibility: 'async',
    returnDocuments: false,
    tag: 'document.commit',
    // This makes sure the studio doesn't crash when a draft is crated
    // because someone deleted a referenced document in the target dataset
    skipCrossDatasetReferenceValidation: true,
  })
}

// Action API path for document-scoped commits; unlike pair checkout, the target id is already known.
function commitActions(
  client: SanityClient,
  documentId: string,
  mutationParams: Mutation['params'],
) {
  if (isLiveEditMutation(mutationParams, getPublishedId(documentId))) {
    return commitMutations(client, mutationParams)
  }

  return client.observable.action(toActions(documentId, mutationParams), {
    tag: 'document.commit',
    transactionId: mutationParams.transactionId,
  })
}

// Shared commit submission wrapper for the single-document checkout, equivalent to pair checkout
// commit handling but without coordinating multiple document variants.
function submitCommitRequest(
  client: SanityClient,
  documentId: string,
  request: CommitRequest,
  serverActionsEnabled: boolean,
): Observable<SingleMutationResult | MultipleActionResult> {
  return from(
    serverActionsEnabled
      ? commitActions(client, documentId, request.mutation.params)
      : commitMutations(client, request.mutation.params),
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

// Tags listener events with the resolved document's variant so existing consumers can still
// distinguish draft, published, and version snapshots.
function setVersion<T>(version: 'draft' | 'published' | 'version') {
  return (ev: T): T & {version: 'draft' | 'published' | 'version'} => ({...ev, version})
}

export interface DocumentCheckout {
  transactionsPendingEvents$: Observable<PendingMutationsEvent>
  document: DocumentVersion
}

// Single-document equivalent of `checkoutPair`: creates one buffered document and one listener
// for the already-resolved id instead of checking out draft/published/version together.
export function documentCheckout(
  documentId: string,
  client: SanityClient,
  serverActionsEnabled: Observable<boolean>,
  options: DocumentStoreExtraOptions = {},
): DocumentCheckout {
  const {
    onReportLatency,
    onSyncErrorRecovery,
    onSlowCommit,
    onReportMutationPerformance,
    onDocumentRebase,
    tag,
  } = options

  const listenerEvents$ = getDocumentListener(client, documentId, {tag, onSyncErrorRecovery})
  const connectionChangeEvents$ = listenerEvents$.pipe(
    filter((ev) => ev.type === 'reconnect' || ev.type === 'welcome' || ev.type === 'welcomeback'),
  )
  const document = createBufferedDocument(documentId, listenerEvents$)

  const transactionsPendingEvents$ = listenerEvents$.pipe(
    filter((ev): ev is PendingMutationsEvent => ev.type === 'pending'),
  )

  const commits$ = document.commitRequest$.pipe(
    mergeMap((commitRequest) =>
      serverActionsEnabled.pipe(
        take(1),
        mergeMap((canUseServerActions) => {
          const apiRequestSentAt = Date.now()
          return submitCommitRequest(client, documentId, commitRequest, canUseServerActions).pipe(
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
    ? document.commitRequest$.pipe(
        switchMap(() => timer(SLOW_COMMIT_TIMEOUT_MS).pipe(takeUntil(commitResolved$))),
        tap(() => onSlowCommit()),
      )
    : EMPTY
  const rebaseEvents$ = onDocumentRebase
    ? merge(document.events).pipe(
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
  const version = getDocumentVariantType(documentId)
  return {
    transactionsPendingEvents$,
    document: {
      ...document,
      events: merge(combinedEvents, connectionChangeEvents$, document.events).pipe(
        map(setVersion(version)),
      ),
      remoteSnapshot$: document.remoteSnapshot$.pipe(map(setVersion(version))),
    },
  }
}
