import {IdPair, SanityDocument, Mutation, ReconnectEvent} from '../types'
import {filter, map, publishReplay, refCount} from 'rxjs/operators'
import {memoizedPair} from './memoizedPair'
import {BufferedDocumentEvent} from '../buffered-doc/createBufferedDocument'
import {SnapshotEvent} from '../buffered-doc/types'
import {memoize} from '../utils/createMemoizer'
import {Observable} from 'rxjs'
import {DocumentVersion} from './checkoutPair'

// return true if the event comes with a document snapshot
function isSnapshotEvent(
  event: BufferedDocumentEvent | ReconnectEvent
): event is SnapshotEvent & {
  version: 'published' | 'draft'
} {
  return event.type === 'snapshot'
}

function withSnapshots(pair: DocumentVersion): DocumentVersionSnapshots {
  return {
    snapshots$: pair.events.pipe(
      filter(isSnapshotEvent),
      map((event) => event.document),
      publishReplay(1),
      refCount()
    ),

    patch: pair.patch,
    create: pair.create,
    createIfNotExists: pair.createIfNotExists,
    createOrReplace: pair.createOrReplace,
    delete: pair.delete,

    mutate: pair.mutate,
    commit: pair.commit,
  }
}
export interface DocumentVersionSnapshots {
  snapshots$: Observable<SanityDocument>

  // helper functions
  patch: (patches) => Mutation[]
  create: (document) => Mutation
  createIfNotExists: (document) => Mutation
  createOrReplace: (document) => Mutation
  delete: () => Mutation

  mutate: (mutations: Mutation[]) => void
  commit: () => Observable<never>
}

interface SnapshotPair {
  draft: DocumentVersionSnapshots
  published: DocumentVersionSnapshots
}

export const snapshotPair = memoize(
  (idPair: IdPair) => {
    return memoizedPair(idPair).pipe(
      map(
        ({published, draft}): SnapshotPair => {
          return {
            published: withSnapshots(published),
            draft: withSnapshots(draft),
          }
        }
      ),
      publishReplay(1),
      refCount()
    )
  },
  (idPair) => idPair.publishedId
)
