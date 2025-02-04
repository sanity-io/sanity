import {type Action, type SanityClient} from '@sanity/client'
import {type Mutation} from '@sanity/mutator'
import {type SanityDocument} from '@sanity/types'
import {omit} from 'lodash'
import {EMPTY, from, merge, type Observable} from 'rxjs'
import {filter, map, mergeMap, share, take, tap} from 'rxjs/operators'

import {type DocumentVariantType} from '../../../../util/getDocumentVariantType'
import {
  type BufferedDocumentEvent,
  type CommitRequest,
  createBufferedDocument,
  type MutationPayload,
  type RemoteSnapshotEvent,
} from '../buffered-doc'
import {getPairListener, type ListenerEvent, type PairListenerOptions} from '../getPairListener'
import {type IdPair, type PendingMutationsEvent, type ReconnectEvent} from '../types'
import {actionsApiClient} from './utils/actionsApiClient'
import {operationsApiClient} from './utils/operationsApiClient'

const isMutationEventForDocId =
  (id: string) =>
  (
    event: ListenerEvent,
  ): event is Exclude<ListenerEvent, ReconnectEvent | PendingMutationsEvent> => {
    return event.type !== 'reconnect' && event.type !== 'pending' && event.documentId === id
  }

/**
 * @hidden
 * @beta */
export type WithVersion<T> = T & {version: DocumentVariantType}

/**
 * @hidden
 * @beta */
export type DocumentVersionEvent = WithVersion<ReconnectEvent | BufferedDocumentEvent>

/**
 * @hidden
 * @beta */
export type RemoteSnapshotVersionEvent = WithVersion<RemoteSnapshotEvent>

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

function commitMutations(client: SanityClient, idPair: IdPair, mutationParams: Mutation['params']) {
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
) {
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

/** @internal */
export function checkoutPair(
  client: SanityClient,
  idPair: IdPair,
  serverActionsEnabled: Observable<boolean>,
  pairListenerOptions?: PairListenerOptions,
): Pair {
  const {publishedId, draftId, versionId} = idPair

  const listenerEvents$ = getPairListener(client, idPair, pairListenerOptions).pipe(share())

  const reconnect$ = listenerEvents$.pipe(
    filter((ev) => ev.type === 'reconnect'),
  ) as Observable<ReconnectEvent>

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

  const commits$ = merge(
    draft.commitRequest$,
    published.commitRequest$,
    version ? version.commitRequest$ : EMPTY,
  ).pipe(
    mergeMap((commitRequest) =>
      serverActionsEnabled.pipe(
        take(1),
        mergeMap((canUseServerActions) =>
          submitCommitRequest(client, idPair, commitRequest, canUseServerActions),
        ),
      ),
    ),
    mergeMap(() => EMPTY),
    share(),
  )

  return {
    transactionsPendingEvents$,
    draft: {
      ...draft,
      events: merge(commits$, reconnect$, draft.events).pipe(map(setVersion('draft'))),
      remoteSnapshot$: draft.remoteSnapshot$.pipe(map(setVersion('draft'))),
    },
    ...(typeof version === 'undefined'
      ? {}
      : {
          version: {
            ...version,
            events: merge(commits$, reconnect$, version.events).pipe(map(setVersion('version'))),
            remoteSnapshot$: version.remoteSnapshot$.pipe(map(setVersion('version'))),
          },
        }),
    published: {
      ...published,
      events: merge(commits$, reconnect$, published.events).pipe(map(setVersion('published'))),
      remoteSnapshot$: published.remoteSnapshot$.pipe(map(setVersion('published'))),
    },
  }
}
