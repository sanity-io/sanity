/**
 * This is the beginning of what should be the data store tracking connection status in the Sanity studio.
 */
import {Observable} from 'rxjs'
declare type ConnectingStatus = {
  type: 'connecting'
}
export declare type ErrorStatus = {
  type: 'error'
  error: Error
  attemptNo: number
  isOffline: boolean
  retryAt: Date
}
declare type RetryingStatus = {
  type: 'retrying'
}
export declare type ConnectedStatus = {
  type: 'connected'
  lastHeartbeat: Date
}
export declare const CONNECTING: ConnectingStatus
export declare type ConnectionStatus =
  | ConnectingStatus
  | ErrorStatus
  | ConnectedStatus
  | RetryingStatus
declare const onRetry: () => void
export {onRetry}
export declare const connectionStatus$: Observable<ConnectionStatus>
