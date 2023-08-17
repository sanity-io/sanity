import {SanityDocument} from '@sanity/types'
import {Observable} from 'rxjs'
import {ListenerEvent} from '../getPairListener'
import {CommitRequest, createObservableBufferedDocument} from './createObservableBufferedDocument'
import {
  CommittedEvent,
  DocumentMutationEvent,
  DocumentRebaseEvent,
  MutationPayload,
  RemoteSnapshotEvent,
  SnapshotEvent,
} from './types'

/**
 * @hidden
 * @beta */
export type BufferedDocumentEvent =
  | SnapshotEvent
  | DocumentRebaseEvent
  | DocumentMutationEvent
  | CommittedEvent

const prepare = (id: string) => (document: Partial<SanityDocument>) => {
  const {_id, _rev, _updatedAt, ...rest} = document
  return {_id: id, ...rest}
}

/** @internal */
export interface BufferedDocumentWrapper {
  consistency$: Observable<boolean>
  remoteSnapshot$: Observable<RemoteSnapshotEvent>
  events: Observable<BufferedDocumentEvent>
  commitRequest$: Observable<CommitRequest>
  // helper functions
  patch: (patches: any[]) => MutationPayload[]
  create: (document: Partial<SanityDocument>) => MutationPayload
  createIfNotExists: (document: SanityDocument) => MutationPayload
  createOrReplace: (document: SanityDocument) => MutationPayload
  delete: () => MutationPayload

  mutate: (mutations: MutationPayload[]) => void
  commit: () => void
}

/** @internal */
export const createBufferedDocument = (
  documentId: string,
  // consider naming it remoteEvent$
  listenerEvent$: Observable<ListenerEvent>,
): BufferedDocumentWrapper => {
  const bufferedDocument = createObservableBufferedDocument(listenerEvent$)

  const prepareDoc = prepare(documentId)

  const DELETE = {delete: {id: documentId}}

  return {
    events: bufferedDocument.updates$,
    consistency$: bufferedDocument.consistency$,
    remoteSnapshot$: bufferedDocument.remoteSnapshot$,
    commitRequest$: bufferedDocument.commitRequest$,

    patch: (patches) => patches.map((patch) => ({patch: {...patch, id: documentId}})),
    create: (document) => ({create: prepareDoc(document)}),
    createIfNotExists: (document) => ({createIfNotExists: prepareDoc(document)}),
    createOrReplace: (document) => ({createOrReplace: prepareDoc(document)}),
    delete: () => DELETE,

    mutate: (mutations: MutationPayload[]) => bufferedDocument.addMutations(mutations),
    commit: () => bufferedDocument.commit(),
  }
}
