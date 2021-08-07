import {BufferedDocumentEvent} from '../buffered-doc/createBufferedDocument'
import {IdPair, Mutation, ReconnectEvent} from '../types'
import {Observable} from 'rxjs'
import {RemoteSnapshotEvent} from '../buffered-doc/types'
declare type WithVersion<T> = T & {
  version: 'published' | 'draft'
}
export declare type DocumentVersionEvent = WithVersion<ReconnectEvent | BufferedDocumentEvent>
export declare type RemoteSnapshotVersionEvent = WithVersion<RemoteSnapshotEvent>
export interface DocumentVersion {
  consistency$: Observable<boolean>
  remoteSnapshot$: Observable<RemoteSnapshotVersionEvent>
  events: Observable<DocumentVersionEvent>
  patch: (patches: any) => Mutation[]
  create: (document: any) => Mutation
  createIfNotExists: (document: any) => Mutation
  createOrReplace: (document: any) => Mutation
  delete: () => Mutation
  mutate: (mutations: Mutation[]) => void
  commit: () => Observable<never>
}
export interface Pair {
  published: DocumentVersion
  draft: DocumentVersion
}
export declare function checkoutPair(idPair: IdPair): Pair
export {}
