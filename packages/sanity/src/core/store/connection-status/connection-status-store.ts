import {type BifurClient, ERROR_CODES, WebSocketError} from '@sanity/bifur-client'
import {observableCallback} from 'observable-callback'
import {concat, fromEvent, merge, NEVER, type Observable, of, throwError, timer} from 'rxjs'
import {
  distinctUntilChanged,
  map,
  mergeMapTo,
  shareReplay,
  startWith,
  switchMap,
  take,
  takeUntil,
} from 'rxjs/operators'

import {catchWithCount} from '../../util/catchWithCount'

/** @internal */
export interface ConnectionStatusStore {
  connectionStatus$: Observable<ConnectionStatus>
}

const onOnline$ = typeof window === 'undefined' ? of({}) : fromEvent(window, 'online')
const onOffline$ = typeof window === 'undefined' ? of({}) : fromEvent(window, 'offline')

const expBackoff = (retryCount: number) => Math.pow(2, retryCount) * 100

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
  /** The shared, replaying token observable passed to bifur, used to resume after rejection. */
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
  const connectionStatus$: Observable<ConnectionStatus> = (token$ || of(null)).pipe(
    distinctUntilChanged(),
    switchMap(() =>
      merge(
        bifur.heartbeats,
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        onOffline$.pipe(mergeMapTo(throwError(new Error('The browser went offline')))),
      ).pipe(
        map((ts): ConnectionStatus => ({type: 'connected', lastHeartbeat: ts})),
        catchWithCount((error, successiveErrorsCount, caught) => {
          const unauthorized =
            error instanceof WebSocketError && error.code === ERROR_CODES.UNAUTHORIZED
          const timeUntilRetry = Math.min(1000 * 240, expBackoff(successiveErrorsCount))
          const retryAt = unauthorized ? null : new Date(Date.now() + timeUntilRetry)
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
          const triggerRetry$ = NEVER.pipe(takeUntil(retry$))

          return concat(of(initialErrorStatus), triggerRetry$.pipe(take(1)), caught)
        }),
      ),
    ),
    startWith(CONNECTING),
    shareReplay({bufferSize: 1, refCount: true}),
  )

  return {connectionStatus$}
}
