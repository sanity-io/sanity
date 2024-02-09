import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {type Observable} from 'rxjs'
import {filter, map, publishReplay, refCount} from 'rxjs/operators'

import {type BufferedDocumentEvent, type MutationPayload, type SnapshotEvent} from '../buffered-doc'
import {type IdPair, type PendingMutationsEvent, type ReconnectEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {type DocumentVersion} from './checkoutPair'
import {memoizedPair} from './memoizedPair'

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
      refCount(),
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

/** @internal */
export interface DocumentVersionSnapshots {
  snapshots$: Observable<SanityDocument>

  // helper functions
  patch: (patches: any[]) => MutationPayload[]
  create: (document: any) => MutationPayload
  createIfNotExists: (document: any) => MutationPayload
  createOrReplace: (document: any) => MutationPayload
  delete: () => MutationPayload

  mutate: (mutations: MutationPayload[]) => void
  commit: () => void
}

/** @internal */
interface SnapshotPair {
  transactionsPendingEvents$: Observable<PendingMutationsEvent>
  draft: DocumentVersionSnapshots
  published: DocumentVersionSnapshots
}

/** @internal */
export const snapshotPair = memoize(
  (client: SanityClient, idPair: IdPair, typeName: string) => {
    return memoizedPair(client, idPair, typeName).pipe(
      map(({published, draft, transactionsPendingEvents$}): SnapshotPair => {
        return {
          transactionsPendingEvents$,
          published: withSnapshots(published),
          draft: withSnapshots(draft),
        }
      }),
      publishReplay(1),
      refCount(),
    )
  },
  (client, idPair, typeName) => {
    const config = client.config()

    return `${config.dataset ?? ''}-${config.projectId ?? ''}-${idPair.publishedId}-${typeName}`
  },
)
