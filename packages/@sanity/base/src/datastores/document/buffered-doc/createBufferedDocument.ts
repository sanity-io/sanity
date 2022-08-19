import {Observable} from 'rxjs'
import {ListenerEvent} from '../getPairListener'
import {Mutation} from '../types'
import {
  CommitFunction,
  CommittedEvent,
  DocumentMutationEvent,
  DocumentRebaseEvent,
  SnapshotEvent,
  RemoteSnapshotEvent,
} from './types'
import {CommitRequest, createObservableBufferedDocument} from './createObservableBufferedDocument'

export type BufferedDocumentEvent =
  | SnapshotEvent
  | DocumentRebaseEvent
  | DocumentMutationEvent
  | CommittedEvent

const prepare = (id) => (document) => {
  const {_id, _rev, _updatedAt, ...rest} = document
  return {_id: id, ...rest}
}

export interface BufferedDocumentWrapper {
  consistency$: Observable<boolean>
  remoteSnapshot$: Observable<RemoteSnapshotEvent>
  events: Observable<BufferedDocumentEvent>
  commits$: Observable<CommitRequest>
  // helper functions
  patch: (patches) => Mutation[]
  create: (document) => Mutation
  createIfNotExists: (document) => Mutation
  createOrReplace: (document) => Mutation
  delete: () => Mutation

  mutate: (mutations: Mutation[]) => void
  commit: () => void
}

export const createBufferedDocument = (
  documentId: string,
  // consider naming it remoteEvent$
  listenerEvent$: Observable<ListenerEvent>
): BufferedDocumentWrapper => {
  const bufferedDocument = createObservableBufferedDocument(listenerEvent$)

  const prepareDoc = prepare(documentId)

  const DELETE = {delete: {id: documentId}}

  return {
    events: bufferedDocument.updates$,
    consistency$: bufferedDocument.consistency$,
    remoteSnapshot$: bufferedDocument.remoteSnapshot$,
    commits$: bufferedDocument.commit$,

    patch: (patches) => patches.map((patch) => ({patch: {...patch, id: documentId}})),
    create: (document) => ({create: prepareDoc(document)}),
    createIfNotExists: (document) => ({createIfNotExists: prepareDoc(document)}),
    createOrReplace: (document) => ({createOrReplace: prepareDoc(document)}),
    delete: () => DELETE,

    mutate: (mutations: Mutation[]) => bufferedDocument.addMutations(mutations),
    commit: (transactionId?: string) => bufferedDocument.commit(transactionId),
  }
}
