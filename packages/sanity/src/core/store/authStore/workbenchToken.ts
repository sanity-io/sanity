import {type Observable, of} from 'rxjs'
import {catchError} from 'rxjs/operators'

import {getMessageBusConnection} from '../messageBus/getMessageBusConnection'

/**
 * Observes the session token issued by the workbench "OS", tracking the OS auth
 * state over time.
 *
 * Returns `undefined` when the Studio is not embedded in the workbench, so the
 * caller uses its normal auth flow. Inside the workbench, subscribes to the
 * `auth.token` state topic, emitting the current token — or `null` when the OS
 * is signed out — and re-emitting as the OS auth state changes, so sign-in/out
 * propagates instead of being captured once. Any bus error is treated as "no
 * token" (`null`). The token is used in-memory only and never persisted.
 *
 * @internal
 */
export function observeWorkbenchToken(): Observable<string | null> | undefined {
  return getMessageBusConnection()
    ?.subscribe('auth.token')
    .pipe(catchError(() => of(null)))
}

/**
 * Asks the workbench "OS" to reissue the session token, e.g. after its current
 * one was rejected with a 401. Fire-and-forget: the reissued token arrives via
 * the `auth.token` subscription in {@link observeWorkbenchToken}. No-op outside
 * the workbench, and a failed request (e.g. the OS is signed out, so nothing
 * responds) is dropped.
 *
 * @internal
 */
export function refreshWorkbenchToken(): void {
  getMessageBusConnection()
    ?.emit('auth.token.refresh')
    .catch(() => {})
}
