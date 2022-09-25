import {BifurClient} from '@sanity/bifur-client'
import {observableCallback} from 'observable-callback'
import {map, mergeMapTo, startWith, take, takeUntil} from 'rxjs/operators'
import {concat, fromEvent, merge, NEVER, Observable, of, throwError, timer} from 'rxjs'
import {catchWithCount} from './utils/catchWithCount'

export interface ConnectionStatusStore {
  connectionStatus$: Observable<ConnectionStatus>
}

const onOnline$ = typeof window === 'undefined' ? of({}) : fromEvent(window, 'online')
const onOffline$ = typeof window === 'undefined' ? of({}) : fromEvent(window, 'offline')

const expBackoff = (retryCount: number) => Math.pow(2, retryCount) * 100

export type ConnectingStatus = {
  type: 'connecting'
}

export type ErrorStatus = {
  type: 'error'
  error: Error
  attemptNo: number
  isOffline: boolean
  retryAt: Date
}

export type RetryingStatus = {
  type: 'retrying'
}

export type ConnectedStatus = {type: 'connected'; lastHeartbeat: Date}

export const CONNECTING: ConnectingStatus = {type: 'connecting'}

export type ConnectionStatus = ConnectingStatus | ErrorStatus | ConnectedStatus | RetryingStatus

const [onRetry$, onRetry] = observableCallback()

export {onRetry}

const createErrorStatus = ({
  error,
  isOffline,
  attemptNo,
  retryAt,
}: {
  error: Error
  isOffline: boolean
  attemptNo: number
  retryAt: Date
}): ErrorStatus => ({
  type: 'error',
  error,
  attemptNo,
  isOffline,
  retryAt,
})

export interface ConnectionStatusStoreOptions {
  bifur: BifurClient
}
/**
 * This is the beginning of what should be the data store tracking connection status in the Sanity studio.
 */

export function createConnectionStatusStore({
  bifur,
}: ConnectionStatusStoreOptions): ConnectionStatusStore {
  const connectionStatus$: Observable<ConnectionStatus> = merge(
    bifur.heartbeats,
    onOffline$.pipe(mergeMapTo(throwError(new Error('The browser went offline'))))
  ).pipe(
    map((ts): ConnectionStatus => ({type: 'connected', lastHeartbeat: ts})),
    catchWithCount((error, successiveErrorsCount, caught) => {
      const timeUntilRetry = Math.min(1000 * 240, expBackoff(successiveErrorsCount))
      const retryAt = new Date(new Date().getTime() + timeUntilRetry)
      const expiry$ = timer(retryAt)
      const isOffline = !navigator.onLine
      const initialErrorStatus = createErrorStatus({
        error,
        retryAt,
        isOffline,
        attemptNo: successiveErrorsCount,
      })

      const triggerRetry$ = NEVER.pipe(
        takeUntil(isOffline ? onOnline$ : merge(expiry$, onOnline$, onRetry$))
      )

      return concat(of(initialErrorStatus), triggerRetry$.pipe(take(1)), caught)
    }),
    startWith(CONNECTING)
  )

  return {connectionStatus$}
}
