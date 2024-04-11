import {type SanityClient} from '@sanity/client'
import {type Mutation} from '@sanity/mutator'
import {type SanityDocument} from '@sanity/types'
import {EMPTY, from, merge, type Observable, type ObservableInput, Subject} from 'rxjs'
import {filter, map, mergeMap, share, tap} from 'rxjs/operators'

import {
  type BufferedDocumentEvent,
  type CommitRequest,
  createBufferedDocument,
  type MutationPayload,
  type RemoteSnapshotEvent,
} from '../buffered-doc'
import {getPairListener, type ListenerEvent} from '../getPairListener'
import {type IdPair, type PendingMutationsEvent, type ReconnectEvent} from '../types'
import {type HttpAction} from './actionTypes'

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
export type WithVersion<T> = T & {version: 'published' | 'draft'}

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
export interface Pair {
  /** @internal */
  transactionsPendingEvents$: Observable<PendingMutationsEvent>
  published: DocumentVersion
  draft: DocumentVersion
  complete: () => void
}

function setVersion<T>(version: 'draft' | 'published') {
  return (ev: T): T & {version: 'draft' | 'published'} => ({...ev, version})
}

function toActions(idPair: IdPair, mutationParams: Mutation['params']) {
  return mutationParams.mutations.map((mutations): HttpAction => {
    if (Object.keys(mutations).length > 1) {
      // todo: this might be a bit too strict, but I'm (lazily) trying to check if we ever get more than one mutation in a payload
      throw new Error('Did not expect multiple mutations in the same payload')
    }
    if (mutations.delete) {
      return {
        actionType: 'sanity.action.document.delete',
        publishedId: idPair.publishedId,
        draftId: idPair.draftId,
      }
    }
    if (mutations.createIfNotExists) {
      return {
        actionType: 'sanity.action.document.create',
        publishedId: idPair.publishedId,
        attributes: {
          ...mutations.createIfNotExists,
          _id: idPair.draftId,
        },
        ifExists: 'ignore',
      }
    }
    if (mutations.patch) {
      return {
        actionType: 'sanity.action.document.edit',
        draftId: idPair.draftId,
        publishedId: idPair.publishedId,
        patch: mutations.patch,
      }
    }
    throw new Error('Todo: implement')
  })
}

function serverCommitMutations(
  defaultClient: SanityClient,
  idPair: IdPair,
  mutationParams: Mutation['params'],
) {
  const vXClient = defaultClient.withConfig({apiVersion: 'X'})

  const {dataset} = defaultClient.config()

  return vXClient.observable.request({
    url: `/data/actions/${dataset}`,
    method: 'post',
    tag: 'document.commit',
    body: {
      transactionId: mutationParams.transactionId,
      actions: toActions(idPair, mutationParams),
    },
  })
}

function commitMutations(client: SanityClient, mutationParams: Mutation['params']) {
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

function submitCommitRequest(
  client: SanityClient,
  idPair: IdPair,
  request: CommitRequest,
  serverActionsEnabled: boolean,
) {
  return from(
    serverActionsEnabled
      ? serverCommitMutations(client, idPair, request.mutation.params)
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

/** @internal */
export function checkoutPair(
  client: SanityClient,
  idPair: IdPair,
  serverActionsEnabled: boolean,
  customSubmitRequest?: () => ObservableInput<any>,
): Pair {
  const {publishedId, draftId} = idPair

  const listenerEventsConnector = new Subject<ListenerEvent>()
  const listenerEvents$ = getPairListener(client, idPair).pipe(
    share({connector: () => listenerEventsConnector}),
  )

  const reconnect$ = listenerEvents$.pipe(
    filter((ev) => ev.type === 'reconnect'),
  ) as Observable<ReconnectEvent>

  const draft = createBufferedDocument(
    draftId,
    listenerEvents$.pipe(filter(isMutationEventForDocId(draftId))),
  )

  const published = createBufferedDocument(
    publishedId,
    listenerEvents$.pipe(filter(isMutationEventForDocId(publishedId))),
  )

  // share commit handling between draft and published
  const transactionsPendingEvents$ = listenerEvents$.pipe(
    filter((ev): ev is PendingMutationsEvent => ev.type === 'pending'),
  )

  const commits$ = merge(draft.commitRequest$, published.commitRequest$).pipe(
    mergeMap((commitRequest) =>
      customSubmitRequest
        ? customSubmitRequest()
        : submitCommitRequest(client, idPair, commitRequest, serverActionsEnabled),
    ),
    mergeMap(() => EMPTY),
    share(),
  )

  return {
    transactionsPendingEvents$,
    draft: {
      ...draft,
      events: merge(commits$, reconnect$, draft.events).pipe(map(setVersion('draft'))),
      consistency$: draft.consistency$,
      remoteSnapshot$: draft.remoteSnapshot$.pipe(map(setVersion('draft'))),
    },
    published: {
      ...published,
      events: merge(commits$, reconnect$, published.events).pipe(map(setVersion('published'))),
      consistency$: published.consistency$,
      remoteSnapshot$: published.remoteSnapshot$.pipe(map(setVersion('published'))),
    },
    complete: () => listenerEventsConnector.complete(),
  }
}
