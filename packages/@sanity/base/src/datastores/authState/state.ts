/* eslint-disable camelcase */

import {Observable, Subject} from 'rxjs'
import {filter} from 'rxjs/operators'
import {CrossWindowMessaging} from '../crossWindowMessaging'

export interface AuthStateState {
  authStateChangedInThisWindow$: Subject<true>
  authStateChangedInOtherWindow$: Observable<AuthStateChangedMessage>
  broadcastAuthStateChanged: (userId: string | undefined) => void
}

export const MSG_AUTH_STATE_CHANGED = 'authStateChange'

export interface AuthStateChangedMessage {
  type: typeof MSG_AUTH_STATE_CHANGED
  id: string | undefined
}

export function __tmp_authState_state(context: {
  crossWindowMessaging: CrossWindowMessaging
}): AuthStateState {
  const {crossWindowMessaging} = context

  // export
  const authStateChangedInThisWindow$ = new Subject<true>()

  // export
  const authStateChangedInOtherWindow$ = crossWindowMessaging.otherWindowMessages$.pipe(
    filter(isAuthChangeMessage)
  )

  // export
  const broadcastAuthStateChanged = (userId: string | undefined): void => {
    const message: AuthStateChangedMessage = {type: MSG_AUTH_STATE_CHANGED, id: userId}
    crossWindowMessaging.crossWindowBroadcast(message)

    authStateChangedInThisWindow$.next(true)
  }

  function isAuthChangeMessage(message: any): message is AuthStateChangedMessage {
    return (
      typeof message === 'object' && 'type' in message && message.type === MSG_AUTH_STATE_CHANGED
    )
  }

  return {authStateChangedInThisWindow$, authStateChangedInOtherWindow$, broadcastAuthStateChanged}
}
