import {merge, Observable} from 'rxjs'
import {filter, map, share} from 'rxjs/operators'
import client from 'part:@sanity/base/client'
import {getPairListener, ListenerEvent} from '../getPairListener'
import {RemoteSnapshotEvent, CommitFunction} from '../buffered-doc/types'
import {BufferedDocumentEvent, createBufferedDocument} from '../buffered-doc/createBufferedDocument'
import {IdPair, Mutation, ReconnectEvent} from '../types'

const isEventForDocId = (id: string) => (event: ListenerEvent): boolean =>
  event.type !== 'reconnect' && event.documentId === id

const commitMutations: CommitFunction = ({mutations, transactionId}) => {
  return client.mutate(
    mutations as any,
    {
      visibility: 'async',
      returnDocuments: false,
      transactionId,
    } as any
  )
}

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
  commit: () => Observable<never>
}

export interface Pair {
  published: DocumentVersion
  draft: DocumentVersion
}

function setVersion<T>(version: 'draft' | 'published') {
  return (ev: T): T & {version: 'draft' | 'published'} => ({...ev, version})
}

export function checkoutPair(idPair: IdPair): Pair {
  const {publishedId, draftId} = idPair

  const listenerEvents$ = getPairListener(client, idPair).pipe(share())

  const reconnect$ = listenerEvents$.pipe(filter((ev) => ev.type === 'reconnect')) as Observable<
    ReconnectEvent
  >

  const draft = createBufferedDocument(
    draftId,
    listenerEvents$.pipe(filter(isEventForDocId(draftId))),
    commitMutations
  )

  const published = createBufferedDocument(
    publishedId,
    listenerEvents$.pipe(filter(isEventForDocId(publishedId))),
    commitMutations
  )

  return {
    draft: {
      ...draft,
      events: merge(reconnect$, draft.events).pipe(map(setVersion('draft'))),
      consistency$: draft.consistency$,
      remoteSnapshot$: draft.remoteSnapshot$.pipe(map(setVersion('draft'))),
    },
    published: {
      ...published,
      events: merge(reconnect$, published.events).pipe(map(setVersion('published'))),
      consistency$: published.consistency$,
      remoteSnapshot$: published.remoteSnapshot$.pipe(map(setVersion('published'))),
    },
  }
}
