import {SanityClient} from '@sanity/client'
import {EMPTY, from, merge, Observable} from 'rxjs'
import {filter, map, mergeMap, mergeMapTo, share, tap} from 'rxjs/operators'
import {SanityDocument} from '@sanity/types'
import {Mutation as MutatorMutation} from '@sanity/mutator'
import {getPairListener, ListenerEvent} from '../getPairListener'
import {
  BufferedDocumentEvent,
  createBufferedDocument,
  RemoteSnapshotEvent,
  CommitRequest,
} from '../buffered-doc'
import {IdPair, Mutation, PendingMutationsEvent, ReconnectEvent} from '../types'

const isMutationEventForDocId =
  (id: string) =>
  (
    event: ListenerEvent
  ): event is Exclude<ListenerEvent, ReconnectEvent | PendingMutationsEvent> => {
    return event.type !== 'reconnect' && event.type !== 'pending' && event.documentId === id
  }

export type WithVersion<T> = T & {version: 'published' | 'draft'}

export type DocumentVersionEvent = WithVersion<ReconnectEvent | BufferedDocumentEvent>
export type RemoteSnapshotVersionEvent = WithVersion<RemoteSnapshotEvent>

export interface DocumentVersion {
  consistency$: Observable<boolean>
  remoteSnapshot$: Observable<RemoteSnapshotVersionEvent>
  events: Observable<DocumentVersionEvent>

  patch: (patches: any[]) => Mutation[]
  create: (document: Partial<SanityDocument>) => Mutation
  createIfNotExists: (document: SanityDocument) => Mutation
  createOrReplace: (document: SanityDocument) => Mutation
  delete: () => Mutation

  mutate: (mutations: Mutation[]) => void
  commit: () => void
}

export interface Pair {
  transactionsPendingEvents$: Observable<PendingMutationsEvent>
  published: DocumentVersion
  draft: DocumentVersion
}

function setVersion<T>(version: 'draft' | 'published') {
  return (ev: T): T & {version: 'draft' | 'published'} => ({...ev, version})
}

function commitMutations(client: SanityClient, mutationParams: MutatorMutation['params']) {
  const {resultRev, ...mutation} = mutationParams
  return client.dataRequest('mutate', mutation, {
    visibility: 'async',
    returnDocuments: false,
    tag: 'document.commit',
  })
}

function submitCommitRequest(client: SanityClient, request: CommitRequest) {
  return from(commitMutations(client, request.mutation.params)).pipe(
    tap({
      error: (error) => {
        const isBadRequest =
          error.name === 'ClientError' && error.statusCode >= 400 && error.statusCode <= 500
        if (isBadRequest) {
          request.cancel(error)
        } else {
          request.failure(error)
        }
      },
      next: () => request.success(),
    })
  )
}

export function checkoutPair(client: SanityClient, idPair: IdPair): Pair {
  const {publishedId, draftId} = idPair

  const listenerEvents$ = getPairListener(client, idPair).pipe(share())

  const reconnect$ = listenerEvents$.pipe(
    filter((ev) => ev.type === 'reconnect')
  ) as Observable<ReconnectEvent>

  const draft = createBufferedDocument(
    draftId,
    listenerEvents$.pipe(filter(isMutationEventForDocId(draftId)))
  )

  const published = createBufferedDocument(
    publishedId,
    listenerEvents$.pipe(filter(isMutationEventForDocId(publishedId)))
  )

  // share commit handling between draft and published
  const transactionsPendingEvents$ = listenerEvents$.pipe(
    filter((ev): ev is PendingMutationsEvent => ev.type === 'pending')
  )

  const commits$ = merge(draft.commitRequest$, published.commitRequest$).pipe(
    mergeMap((commitRequest) => submitCommitRequest(client, commitRequest)),
    mergeMapTo(EMPTY),
    share()
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
  }
}
