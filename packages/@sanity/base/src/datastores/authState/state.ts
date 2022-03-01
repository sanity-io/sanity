import {Subject} from 'rxjs'
import {filter} from 'rxjs/operators'
import {otherWindowMessages$, crossWindowBroadcast} from '../crossWindowMessaging'

const MSG_AUTH_STATE_CHANGED = 'authStateChange'

interface AuthStateChangedMessage {
  type: typeof MSG_AUTH_STATE_CHANGED
  id: string | undefined
}

export const authStateChangedInThisWindow$ = new Subject<true>()

export const authStateChangedInOtherWindow$ = otherWindowMessages$.pipe(filter(isAuthChangeMessage))

export const broadcastAuthStateChanged = (userId: string | undefined): void => {
  const message: AuthStateChangedMessage = {type: MSG_AUTH_STATE_CHANGED, id: userId}
  crossWindowBroadcast(message)

  authStateChangedInThisWindow$.next(true)
}

function isAuthChangeMessage(message: any): message is AuthStateChangedMessage {
  return typeof message === 'object' && 'type' in message && message.type === MSG_AUTH_STATE_CHANGED
}
