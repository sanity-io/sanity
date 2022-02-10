import config from 'config:sanity'
import {concat, defer, merge, Observable, of} from 'rxjs'
import {filter, shareReplay, switchMapTo} from 'rxjs/operators'
import {otherWindowMessages$, crossWindowBroadcast} from '../crossWindowMessaging'
import {getToken} from './token'

export {deleteToken, fetchToken, getToken, saveToken} from './token'

const MSG_AUTH_STATE_CHANGED = 'authStateChange'

export const broadcastAuthStateChanged = (): void => crossWindowBroadcast(MSG_AUTH_STATE_CHANGED)

const authStateChangedInOtherTab$ = otherWindowMessages$.pipe(
  filter((msg) => msg === MSG_AUTH_STATE_CHANGED)
)

// TODO: some kind of refresh mechanism here when we support refresh tokens / stamping?
const freshToken$ = defer(() => {
  const projectId = config.api.projectId
  if (!projectId) {
    return null
  }
  return of(getToken(projectId))
})

export const authToken$: Observable<string | undefined> = defer(() =>
  concat(freshToken$, merge(authStateChangedInOtherTab$).pipe(switchMapTo(freshToken$)))
).pipe(shareReplay({bufferSize: 1, refCount: true}))
