import {Observable} from 'rxjs'
import {PresenceLocation} from '../types'
export declare type Incoming<T> = T & {
  userId: string
  timestamp: string
  sessionId: string
}
export interface StateMessage {
  type: 'state'
  locations: PresenceLocation[]
}
export interface StateEvent extends StateMessage {
  userId: string
  timestamp: string
  sessionId: string
}
export interface DisconnectMessage {
  type: 'disconnect'
}
export interface DisconnectEvent extends DisconnectMessage {
  userId: string
  timestamp: string
  sessionId: string
}
export interface RollCallMessage {
  type: 'rollCall'
}
export interface RollCallEvent extends RollCallMessage {
  sessionId: string
  userId: string
}
export declare type TransportMessage = DisconnectMessage | StateMessage | RollCallMessage
export declare type TransportEvent = StateEvent | RollCallEvent | DisconnectEvent
export declare type Transport = [
  Observable<TransportEvent>,
  (message: TransportMessage) => Observable<void>
]
