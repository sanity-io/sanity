import {EMPTY, from, merge, Observable} from 'rxjs'
import {filter, map, mergeMap, mergeMapTo, share, tap} from 'rxjs/operators'
import {Mutation as MutatorMutation} from '@sanity/mutator'
import {versionedClient} from '../../../client/versionedClient'
import {getPairListener, ListenerEvent} from '../getPairListener'
import {BufferedDocumentEvent, createBufferedDocument} from '../buffered-doc/createBufferedDocument'
import {IdPair, Mutation, ReconnectEvent} from '../types'
import {RemoteSnapshotEvent} from '../buffered-doc/types'
import {CommitRequest} from '../buffered-doc/createObservableBufferedDocument'

const isMutationEventForDocId = (id: string) => (event: ListenerEvent): boolean =>
  event.type !== 'reconnect' && event.documentId === id

type WithVersion<T> = T & {version: 'published' | 'draft'}

export type DocumentVersionEvent = WithVersion<ReconnectEvent | BufferedDocumentEvent>
export type RemoteSnapshotVersionEvent = WithVersion<RemoteSnapshotEvent>

export interface DocumentVersion {
  consistency$: Observable<boolean>
  remoteSnapshot$: Observable<RemoteSnapshotVersionEvent>
  events: Observable<DocumentVersionEvent>

  patch: (patches) => Mutation[]
  create: (document) => Mutation
  createIfNotExists: (document) => Mutation
  createOrReplace: (document) => Mutation
  delete: () => Mutation

  mutate: (mutations: Mutation[]) => void
  commit: () => void
}

export interface Pair {
  published: DocumentVersion
  draft: DocumentVersion
}

function setVersion<T>(version: 'draft' | 'published') {
  return (ev: T): T & {version: 'draft' | 'published'} => ({...ev, version})
}

function commitMutations(mutationParams: MutatorMutation['params']) {
  const {resultRev, ...mutation} = mutationParams
  return versionedClient.dataRequest('mutate', mutation, {
    visibility: 'async',
    returnDocuments: false,
    tag: 'document.commit',
  })
}

function submitCommitRequest(request: CommitRequest) {
  return from(commitMutations(request.mutation.params)).pipe(
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

export function checkoutPair(idPair: IdPair): Pair {
  const {publishedId, draftId} = idPair

  const listenerEvents$ = getPairListener(versionedClient, idPair).pipe(share())

  const reconnect$ = listenerEvents$.pipe(filter((ev) => ev.type === 'reconnect')) as Observable<
    ReconnectEvent
  >

  const draft = createBufferedDocument(
    draftId,
    listenerEvents$.pipe(filter(isMutationEventForDocId(draftId)))
  )

  const published = createBufferedDocument(
    publishedId,
    listenerEvents$.pipe(filter(isMutationEventForDocId(publishedId)))
  )

  // share commit handling between draft and published
  const commits$ = merge(draft.commitRequest$, published.commitRequest$).pipe(
    mergeMap(submitCommitRequest),
    mergeMapTo(EMPTY),
    share()
  )

  return {
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
