import {IdPair, SanityDocument} from '../types'
import {filter, map, publishReplay, refCount} from 'rxjs/operators'
import {cachedPair} from './cachedPair'
import {BufferedDocumentEvent} from '../buffered-doc/createBufferedDocument'
import {DocumentMutationEvent, DocumentRebaseEvent, SnapshotEvent} from '../buffered-doc/types'
import {createObservableCache} from '../utils/createObservableCache'
import {Observable} from 'rxjs'
import {DocumentVersion} from './checkoutPair'

// return true if the event comes with a document snapshot
function hasDocument(
  event: BufferedDocumentEvent
): event is (SnapshotEvent | DocumentRebaseEvent | DocumentMutationEvent) & {
  version: 'published' | 'draft'
} {
  return event.type === 'snapshot' || event.type === 'rebase' || event.type === 'mutation'
}

function withSnapshots(pair: DocumentVersion): DocumentVersionSnapshots {
  return {
    snapshots$: pair.events.pipe(
      filter(hasDocument),
      map(event => event.document),
      publishReplay(1),
      refCount()
    ),
    patch: pair.patch,
    create: pair.create,
    createIfNotExists: pair.createIfNotExists,
    createOrReplace: pair.createOrReplace,
    delete: pair.delete,
    commit: pair.commit
  }
}

export interface DocumentVersionSnapshots {
  snapshots$: Observable<SanityDocument>
  patch: (patches) => void
  create: (document) => void
  createIfNotExists: (document) => void
  createOrReplace: (document) => void
  delete: () => void
  commit: () => Observable<never>
}

export interface SnapshotPair {
  draft: DocumentVersionSnapshots
  published: DocumentVersionSnapshots
}

const cacheOn = createObservableCache<SnapshotPair>()

export function snapshotPair(idPair: IdPair) {
  return cachedPair(idPair).pipe(
    map(
      ({published, draft}): SnapshotPair => {
        return {
          published: withSnapshots(published),
          draft: withSnapshots(draft)
        }
      }
    ),
    publishReplay(1),
    refCount(),
    cacheOn(idPair.publishedId)
  )
}
