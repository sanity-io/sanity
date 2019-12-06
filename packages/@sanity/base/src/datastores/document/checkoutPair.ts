import {getPairListener, ListenerEvent} from './getPairListener'
import {
  BufferedDocumentWrapper,
  createBufferedDocument
} from './buffered-doc/createBufferedDocument'
import {share, filter} from 'rxjs/operators'
import {IdPair} from './types'

const isEventForDocId = (id: string) => (event: ListenerEvent): boolean =>
  event.type === 'reconnect' || (event.type !== 'welcome' && event.documentId === id)

export function doCommit(client, mutations) {
  return client.observable.dataRequest('mutate', mutations, {
    visibility: 'async',
    returnDocuments: false
  })
}

export interface BufferedDocumentPair {
  draft: BufferedDocumentWrapper
  published: BufferedDocumentWrapper
}

export function checkoutPair(client, idPair: IdPair): BufferedDocumentPair {
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

  return {draft, published}
}
