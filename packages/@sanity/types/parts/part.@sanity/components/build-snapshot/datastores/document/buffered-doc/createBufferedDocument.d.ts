import {Observable} from 'rxjs'
import {
  CommitFunction,
  CommittedEvent,
  DocumentMutationEvent,
  DocumentRebaseEvent,
  SnapshotEvent,
  RemoteSnapshotEvent,
} from './types'
import {ListenerEvent} from '../getPairListener'
import {Mutation} from '../types'
export declare type BufferedDocumentEvent =
  | SnapshotEvent
  | DocumentRebaseEvent
  | DocumentMutationEvent
  | CommittedEvent
export interface BufferedDocumentWrapper {
  consistency$: Observable<boolean>
  remoteSnapshot$: Observable<RemoteSnapshotEvent>
  events: Observable<BufferedDocumentEvent>
  patch: (patches: any) => Mutation[]
  create: (document: any) => Mutation
  createIfNotExists: (document: any) => Mutation
  createOrReplace: (document: any) => Mutation
  delete: () => Mutation
  mutate: (mutations: Mutation[]) => void
  commit: () => Observable<never>
}
export declare const createBufferedDocument: (
  documentId: string,
  listenerEvent$: Observable<ListenerEvent>,
  commitMutations: CommitFunction
) => BufferedDocumentWrapper
