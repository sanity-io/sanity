import {createObservableBufferedDocument} from './createObservableBufferedDocument'
import {Observable} from 'rxjs'
import {
  CommitFunction,
  CommittedEvent,
  DocumentMutationEvent,
  DocumentRebaseEvent,
  SnapshotEvent
} from './types'
import {ListenerEvent} from '../getPairListener'

export type BufferedDocumentEvent =
  | SnapshotEvent
  | DocumentRebaseEvent
  | DocumentMutationEvent
  | CommittedEvent

export interface BufferedDocumentWrapper {
  events: Observable<BufferedDocumentEvent>
  patch: (patches) => void
  create: (document) => void
  createIfNotExists: (document) => void
  createOrReplace: (document) => void
  delete: () => void
  commit: () => Observable<never>
}

export const createBufferedDocument = (
  documentId: string,
  // consider naming it remoteEvent$
  listenerEvent$: Observable<ListenerEvent>,
  doCommit: CommitFunction
): BufferedDocumentWrapper => {
  const bufferedDocument = createObservableBufferedDocument(listenerEvent$, doCommit)

  return {
    events: bufferedDocument.updates$,
    patch(patches) {
      bufferedDocument.addMutations(patches.map(patch => ({patch: {...patch, id: documentId}})))
    },
    create(document) {
      bufferedDocument.addMutation({
        create: document
      })
    },
    createIfNotExists(document) {
      bufferedDocument.addMutation({createIfNotExists: document})
    },
    createOrReplace(document) {
      bufferedDocument.addMutation({createOrReplace: document})
    },
    delete() {
      bufferedDocument.addMutation({delete: {id: documentId}})
    },
    commit() {
      return bufferedDocument.commit()
    }
  }
}
