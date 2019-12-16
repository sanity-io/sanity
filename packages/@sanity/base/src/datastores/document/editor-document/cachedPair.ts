import {IdPair} from '../types'
import {BufferedDocumentEvent} from '../buffered-doc/createBufferedDocument'
import docStore from '../document-store'
import {defer, Observable, of} from 'rxjs'
import {createObservableCache} from '../utils/createObservableCache'
import {BufferedDocumentPair} from '../checkoutPair'

export interface LocalDocumentUpdate {
  target: 'draft' | 'published'
  event: BufferedDocumentEvent
  patch: (patches) => void
  create: (document) => void
  createIfNotExists: (document) => void
  createOrReplace: (document) => void
  delete: () => void
  commit: () => Observable<never>
}

export interface CachedPair {
  id: string
  draft: LocalDocumentUpdate
  published: LocalDocumentUpdate
}

const cacheOn = createObservableCache<BufferedDocumentPair>()

export function cachedPair(idPair: IdPair) {
  return defer(() => of(docStore.checkoutPair(idPair))).pipe(cacheOn(idPair.publishedId))
}
