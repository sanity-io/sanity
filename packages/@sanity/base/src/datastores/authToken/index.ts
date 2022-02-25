import {concat, defer, merge, of, Subject} from 'rxjs'
import {filter, shareReplay, switchMapTo} from 'rxjs/operators'
import {otherWindowMessages$, crossWindowBroadcast} from '../crossWindowMessaging'
import {getToken} from './token'
import {readConfig, authTokenIsAllowed} from './config'

export {authTokenIsAllowed} from './config'
export {clearToken, fetchToken, getToken, saveToken} from './token'

const MSG_AUTH_STATE_CHANGED = 'authStateChange'

const authStateChangedInThisWindow$ = new Subject<string>()

const authStateChangedInOtherWindow$ = otherWindowMessages$.pipe(
  filter((msg) => msg === MSG_AUTH_STATE_CHANGED)
)

export const broadcastAuthStateChanged = (): void => {
  crossWindowBroadcast(MSG_AUTH_STATE_CHANGED)
  authStateChangedInThisWindow$.next(MSG_AUTH_STATE_CHANGED)
}

// TODO: some kind of refresh mechanism here when we support refresh tokens / stamping?
const freshToken$ = defer(() => {
  if (!authTokenIsAllowed()) {
    return of(null)
  }

  const {projectId} = readConfig()
  if (!projectId) {
    throw new Error('No projectId configured')
  }
  return of(getToken(projectId))
})

export const authToken$ = defer(() =>
  concat(
    freshToken$,
    merge(authStateChangedInOtherWindow$, authStateChangedInThisWindow$).pipe(
      switchMapTo(freshToken$)
    )
  )
).pipe(shareReplay({bufferSize: 1, refCount: true}))
