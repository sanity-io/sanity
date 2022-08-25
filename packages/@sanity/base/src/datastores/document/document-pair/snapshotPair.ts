import {SanityDocument} from '@sanity/types'
import {filter, map, publishReplay, refCount} from 'rxjs/operators'
import {Observable} from 'rxjs'
import {IdPair, Mutation, PendingMutationsEvent, ReconnectEvent} from '../types'
import {BufferedDocumentEvent} from '../buffered-doc/createBufferedDocument'
import {SnapshotEvent} from '../buffered-doc/types'
import {memoize} from '../utils/createMemoizer'
import {memoizedPair} from './memoizedPair'
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
  commit: () => void
}

interface SnapshotPair {
  transactionsPendingEvents$: Observable<PendingMutationsEvent>
  draft: DocumentVersionSnapshots
  published: DocumentVersionSnapshots
}

export const snapshotPair = memoize(
  (idPair: IdPair, typeName: string) => {
    return memoizedPair(idPair, typeName).pipe(
      map(
        ({published, draft, transactionsPendingEvents$}): SnapshotPair => {
          return {
            transactionsPendingEvents$,
            published: withSnapshots(published),
            draft: withSnapshots(draft),
          }
        }
      ),
      publishReplay(1),
      refCount()
    )
  },
  (idPair, typeName) => idPair.publishedId + typeName
)
