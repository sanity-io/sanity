import {type Observable} from 'rxjs'

import {type PresenceLocation} from '../types'

// Not sure if this is the best choice of words, but:
// Message: something you send
// Event: something you receive

export type Incoming<T> = T & {
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

export interface AuthorizationExpireMessage {
  type: 'authorizationExpire'
}

export interface AuthorizationExpireEvent extends AuthorizationExpireMessage {
  expiresAt: string
  timestamp: string
}

export type TransportMessage =
  | DisconnectMessage
  | StateMessage
  | RollCallMessage
  | AuthorizationExpireMessage
export type TransportEvent = StateEvent | RollCallEvent | DisconnectEvent | AuthorizationExpireEvent

// This is the interface a transport must implement
export type Transport = [
  Observable<TransportEvent>,
  Observable<TransportEvent>,
  (message: TransportMessage) => Observable<void>,
]
