import {Observable} from 'rxjs'
import {IdPair, MutationEvent, ReconnectEvent, SanityClient, SanityDocument} from './types'
export interface InitialSnapshotEvent {
  type: 'snapshot'
  documentId: string
  document: SanityDocument | null
}
export {MutationEvent}
export declare type ListenerEvent = MutationEvent | ReconnectEvent | InitialSnapshotEvent
export declare function getPairListener(
  client: SanityClient,
  idPair: IdPair
): Observable<ReconnectEvent | MutationEvent | InitialSnapshotEvent>
