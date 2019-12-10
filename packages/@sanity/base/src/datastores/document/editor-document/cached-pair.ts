import {IdPair, SanityDocument} from '../types'
import {BufferedDocumentEvent, BufferedDocumentWrapper} from '../buffered-doc/createBufferedDocument'
import {DocumentMutationEvent, DocumentRebaseEvent, SnapshotEvent} from '../buffered-doc/types'
import docStore from '../document-store'
import {defer, merge, Observable} from 'rxjs'
import {filter, finalize, map, publishReplay, refCount, scan} from 'rxjs/operators'

interface LocalDocument {
  snapshot: SanityDocument | null
  patch: (patches) => void
  create: (document) => void
  createIfNotExists: (document) => void
  createOrReplace: (document) => void
  delete: () => void
  commit: () => Observable<never>
}

export interface CachedPair {
  id: string
  draft: LocalDocument
  published: LocalDocument
}

function hasDocument(
  event: BufferedDocumentEvent
): event is SnapshotEvent | DocumentRebaseEvent | DocumentMutationEvent {
  return event.type === 'snapshot' || event.type === 'rebase' || event.type === 'mutation'
}

function isLocalPair(event: any): event is CachedPair {
  return 'draft' in event && 'published' in event
}

function toLocalDocument(bdw: BufferedDocumentWrapper) {
  return bdw.events.pipe(
    filter(hasDocument),
    map(event => ({
      snapshot: event.document,
      patch: bdw.patch,
      create: bdw.create,
      createIfNotExists: bdw.createIfNotExists,
      createOrReplace: bdw.createOrReplace,
      delete: bdw.delete,
      commit: bdw.commit
    }))
  )
}

function createCache<T>() {
  const CACHE: {[key: string]: Observable<T>} = Object.create(null)
  return function cacheBy(id: string) {
    return (input$: Observable<T>): Observable<T> => {
      return new Observable<T>(subscriber => {
        if (!(id in CACHE)) {
          console.log('setting up', id)
          CACHE[id] = input$.pipe(
            finalize(() => {
              console.log('disposing', id)
              delete CACHE[id]
            }),
            publishReplay(1),
            refCount()
          )
        }
        return CACHE[id].subscribe(subscriber)
      })
    }
  }
}

const cacheBy = createCache<CachedPair>()

export function getPair(idPair: IdPair): Observable<CachedPair> {
  return defer(() => {
    const {draft, published} = docStore.checkoutPair(idPair)
    const draftEvents$ = toLocalDocument(draft).pipe(map(ev => ({draft: ev})))
    const publishedEvents$ = toLocalDocument(published).pipe(map(ev => ({published: ev})))
    return merge(draftEvents$, publishedEvents$).pipe(
      scan((prev, curr) => ({...prev, ...curr}), {}),
      filter(isLocalPair)
    )
  }).pipe(cacheBy(idPair.publishedId))
}
