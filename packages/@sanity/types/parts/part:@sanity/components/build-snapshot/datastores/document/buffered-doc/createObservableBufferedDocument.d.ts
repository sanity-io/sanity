import {Observable} from 'rxjs'
import {ListenerEvent} from '../getPairListener'
import {
  CommitFunction,
  DocumentMutationEvent,
  DocumentRebaseEvent,
  MutationPayload,
  SnapshotEvent,
  RemoteSnapshotEvent,
} from './types'
export declare const createObservableBufferedDocument: (
  listenerEvent$: Observable<ListenerEvent>,
  commitMutations: CommitFunction
) => {
  updates$: Observable<DocumentRebaseEvent | DocumentMutationEvent | SnapshotEvent>
  consistency$: Observable<boolean>
  remoteSnapshot$: Observable<RemoteSnapshotEvent>
  addMutation: (mutation: MutationPayload) => void
  addMutations: (mutations: MutationPayload[]) => void
  commit: () => Observable<never>
}
