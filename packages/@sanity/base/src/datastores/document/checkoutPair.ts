import {getPairListener, ListenerEvent} from './getPairListener'
import {BufferedDocumentEvent, createBufferedDocument} from './buffered-doc/createBufferedDocument'
import {share, filter, map} from 'rxjs/operators'
import {IdPair} from './types'
import {Observable} from 'rxjs'

const isEventForDocId = (id: string) => (event: ListenerEvent): boolean =>
  event.type === 'reconnect' || (event.type !== 'welcome' && event.documentId === id)

export function doCommit(client, mutations) {
  return client.observable.dataRequest('mutate', mutations, {
    visibility: 'async',
    returnDocuments: false
  })
}

export type DocumentVersionEvent = BufferedDocumentEvent & {version: 'published' | 'draft'}
export interface DocumentVersion {
  events: Observable<DocumentVersionEvent>
  patch: (patches) => void
  create: (document) => void
  createIfNotExists: (document) => void
  createOrReplace: (document) => void
  delete: () => void
  commit: () => Observable<never>
}

export interface Pair {
  published: DocumentVersion
  draft: DocumentVersion
}

function setVersion(version: 'draft' | 'published') {
  return (ev: BufferedDocumentEvent): DocumentVersionEvent => ({...ev, version})
}

export function checkoutPair(client, idPair: IdPair): Pair {
  const {publishedId, draftId} = idPair

  const listenerEvents$ = getPairListener(client, idPair).pipe(share())

  const _doCommit = mutations => doCommit(client, mutations)

  const draft = createBufferedDocument(
    draftId,
    listenerEvents$.pipe(filter(isEventForDocId(draftId))),
    _doCommit
  )

  const published = createBufferedDocument(
    publishedId,
    listenerEvents$.pipe(filter(isEventForDocId(publishedId))),
    _doCommit
  )

  return {
    draft: {
      ...draft,
      events: draft.events.pipe(map(setVersion('draft')))
    },
    published: {
      ...published,
      events: draft.events.pipe(map(setVersion('published')))
    }
  }
}
