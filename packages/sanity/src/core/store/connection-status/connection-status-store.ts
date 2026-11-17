import {type BifurClient, ERROR_CODES, RpcError, WebSocketError} from '@sanity/bifur-client'
import {observableCallback} from 'observable-callback'
import {concat, EMPTY, fromEvent, merge, type Observable, of, throwError, timer} from 'rxjs'
import {
  distinctUntilChanged,
  map,
  mergeMap,
  mergeMapTo,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs/operators'

import {catchWithCount} from '../../util/catchWithCount'

/** @internal */
export interface ConnectionStatusStore {
  connectionStatus$: Observable<ConnectionStatus>
}

const onOnline$ = typeof window === 'undefined' ? of({}) : fromEvent(window, 'online')
const onOffline$ = typeof window === 'undefined' ? of({}) : fromEvent(window, 'offline')

const expBackoff = (retryCount: number) => Math.pow(2, retryCount) * 100

/** The server rejected the token, by closing the socket or by answering `authorization` */
const isUnauthorized = (error: unknown) =>
  (error instanceof WebSocketError || error instanceof RpcError) &&
  error.code === ERROR_CODES.UNAUTHORIZED

/** @internal */
export type ConnectingStatus = {
  type: 'connecting'
}

/** @internal */
export type ErrorStatus = {
  type: 'error'
  error: Error
  attemptNo: number
  isOffline: boolean
  /** Null when retrying requires changed credentials or an explicit retry. */
  retryAt: Date | null
}

/** @internal */
export type RetryingStatus = {
  type: 'retrying'
}

/** @internal */
export type ConnectedStatus = {type: 'connected'; lastHeartbeat: Date}

/** @internal */
export const CONNECTING: ConnectingStatus = {type: 'connecting'}

/** @internal */
export type ConnectionStatus = ConnectingStatus | ErrorStatus | ConnectedStatus | RetryingStatus

const _callback = observableCallback()

const onRetry$ = _callback[0]

/** @internal */
export const onRetry = _callback[1]

const createErrorStatus = ({
  error,
  isOffline,
  attemptNo,
  retryAt,
}: {
  error: Error
  isOffline: boolean
  attemptNo: number
  retryAt: Date | null
}): ErrorStatus => ({
  type: 'error',
  error,
  attemptNo,
  isOffline,
  retryAt,
})

/** @internal */
export interface ConnectionStatusStoreOptions {
  bifur: BifurClient
  /** The token bifur authorizes with. A new one starts a fresh attempt, with a fresh backoff. */
  token$?: Observable<string | null>
}

/**
 * This is the beginning of what should be the data store tracking connection status in the Sanity studio.
 *
 * @internal
 */
export function createConnectionStatusStore({
  bifur,
  token$,
}: ConnectionStatusStoreOptions): ConnectionStatusStore {
  // `isRenewal`: the token replaced an earlier one, and a rejection may still be the server
  // answering the token before it
  const attempt = (isRenewal: boolean): Observable<ConnectionStatus> =>
    merge(
      bifur.heartbeats,
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      onOffline$.pipe(mergeMapTo(throwError(new Error('The browser went offline')))),
    ).pipe(
      map((ts): ConnectionStatus => ({type: 'connected', lastHeartbeat: ts})),
      catchWithCount((error, successiveErrorsCount, caught) => {
        // A rejected token is rejected again on every retry, so wait for a new token or an
        // explicit retry instead. The first rejection after a renewal is retried once on the
        // usual delay, in case the server closed the socket for the previous token.
        const waitForNewToken = isUnauthorized(error) && !(isRenewal && successiveErrorsCount === 1)
        const timeUntilRetry = Math.min(1000 * 240, expBackoff(successiveErrorsCount))
        const retryAt = waitForNewToken ? null : new Date(Date.now() + timeUntilRetry)
        const isOffline = !navigator.onLine
        const initialErrorStatus = createErrorStatus({
          error: error instanceof Error ? error : new Error(String(error)),
          retryAt,
          isOffline,
          attemptNo: successiveErrorsCount,
        })

        const retry$ =
          retryAt === null
            ? onRetry$
            : isOffline
              ? onOnline$
              : merge(timer(retryAt), onOnline$, onRetry$)

        return concat(
          of(initialErrorStatus),
          retry$.pipe(
            take(1),
            mergeMap(() => EMPTY),
          ),
          caught,
        )
      }),
    )

  const connectionStatus$: Observable<ConnectionStatus> = (token$ ?? of(null)).pipe(
    distinctUntilChanged(),
    // A new token starts over, also after a rejection. The open socket, if any, stays: bifur
    // authorizes it with the new token.
    switchMap((_token, index) => attempt(index > 0)),
    startWith(CONNECTING),
    // One retry cycle for every consumer (presence, the status indicator)
    shareReplay({bufferSize: 1, refCount: true}),
  )

  return {connectionStatus$}
}
