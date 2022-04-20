import {SanityClient} from '@sanity/client'
import {SanityDocument} from '@sanity/types'
import {filter, map, publishReplay, refCount} from 'rxjs/operators'
import {Observable} from 'rxjs'
import {IdPair, Mutation, ReconnectEvent} from '../types'
import {BufferedDocumentEvent} from '../buffered-doc/createBufferedDocument'
import {SnapshotEvent} from '../buffered-doc/types'
import {memoize} from '../utils/createMemoizer'
import {memoizedPair} from './memoizedPair'
import {DocumentVersion} from './checkoutPair'

// return true if the event comes with a document snapshot
function isSnapshotEvent(event: BufferedDocumentEvent | ReconnectEvent): event is SnapshotEvent & {
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
  patch: (patches: any[]) => Mutation[]
  create: (document: any) => Mutation
  createIfNotExists: (document: any) => Mutation
  createOrReplace: (document: any) => Mutation
  delete: () => Mutation

  mutate: (mutations: Mutation[]) => void
  commit: () => Observable<never>
}

export interface SnapshotPair {
  draft: DocumentVersionSnapshots
  published: DocumentVersionSnapshots
}

export const snapshotPair = memoize(
  (client: SanityClient, idPair: IdPair, typeName: string) => {
    return memoizedPair(client, idPair, typeName).pipe(
      map(({published, draft}): SnapshotPair => {
        return {
          published: withSnapshots(published),
          draft: withSnapshots(draft),
        }
      }),
      publishReplay(1),
      refCount()
    )
  },
  (_client, idPair, typeName) => idPair.publishedId + typeName
)
