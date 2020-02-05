import {getPairListener, ListenerEvent} from '../getPairListener'
import {BufferedDocumentEvent, createBufferedDocument} from '../buffered-doc/createBufferedDocument'
import {filter, map, share} from 'rxjs/operators'
import {IdPair, Mutation} from '../types'
import {merge, Observable} from 'rxjs'
import client from 'part:@sanity/base/client'

const isEventForDocId = (id: string) => (event: ListenerEvent): boolean =>
  event.type !== 'reconnect' && event.documentId === id

function commitMutations(mutations) {
  return client.dataRequest('mutate', mutations, {
    visibility: 'async',
    returnDocuments: false
  })
}

export type DocumentVersionEvent = BufferedDocumentEvent & {version: 'published' | 'draft'}

export interface DocumentVersion {
  consistency$: Observable<boolean>
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

function setVersion(version: 'draft' | 'published') {
  return (ev: any): DocumentVersionEvent => ({...ev, version})
}

export function checkoutPair(idPair: IdPair): Pair {
  const {publishedId, draftId} = idPair

  const listenerEvents$ = getPairListener(client, idPair).pipe(share())

  const reconnect$ = listenerEvents$.pipe(filter(ev => ev.type === 'reconnect'))

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
      consistency$: draft.consistency$
    },
    published: {
      ...published,
      events: merge(reconnect$, published.events).pipe(map(setVersion('published'))),
      consistency$: published.consistency$
    }
  }
}
