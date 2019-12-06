import {createObservableBufferedDocument} from './createObservableBufferedDocument'
import {filter} from 'rxjs/operators'
import {merge, Observable} from 'rxjs'
import {ReconnectEvent} from '../types'
import {
  CommitFunction,
  SnapshotEvent,
  CommittedEvent,
  DocumentRebaseEvent,
  DocumentMutationEvent
} from './types'
import {ListenerEvent} from '../getPairListener'

type BufferedDocumentEvent =
  | ReconnectEvent
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

function isReconnect(event: ListenerEvent): event is ReconnectEvent {
  return event.type === 'reconnect'
}
export const createBufferedDocument = (
  documentId: string,
  serverEvents$: Observable<ListenerEvent>,
  doCommit: CommitFunction
): BufferedDocumentWrapper => {
  const bufferedDocument = createObservableBufferedDocument(serverEvents$, doCommit)

  const reconnects$ = serverEvents$.pipe(filter(isReconnect))

  return {
    events: merge(reconnects$, bufferedDocument.updates$),
    patch(patches) {
      bufferedDocument.addMutations(patches.map(patch => ({patch: {...patch, id: documentId}})))
    },
    create(document) {
      bufferedDocument.addMutation({
        create: Object.assign({id: documentId}, document)
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
