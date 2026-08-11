import {useTelemetry} from '@sanity/telemetry/react'
import {type ComponentType, type ReactNode, useEffect, useMemo, useState} from 'react'
import {useSyncObservable} from 'react-rx'
import {catchError, map, of} from 'rxjs'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {type AuthStore} from '../store/authStore/types'
import {
  AuthBoundaryResolved,
  SessionTokenExchangeCompleted,
} from './__telemetry__/authBoundary.telemetry'
import {StudioAuthReadyMeasured} from './__telemetry__/bootstrap.telemetry'
import {useActiveWorkspace} from './activeWorkspaceMatcher/useActiveWorkspace'
import {AuthenticateScreen} from './screens/AuthenticateScreen'
import {NotAuthenticatedScreen} from './screens/NotAuthenticatedScreen'
import {RequestAccessScreen} from './screens/RequestAccessScreen'
import {getPageVisibilitySnapshot} from './telemetry/pageVisibility'

// Module-level one-shot guard. Survives StrictMode double-mount in dev so the
// event only fires once per page load (HMR resets this naturally).
let authReadyFired = false

interface AuthBoundaryProps {
  children: ReactNode
  AuthenticateComponent?: ComponentType
  LoadingComponent?: ComponentType
  NotAuthenticatedComponent?: ComponentType
}

type LoggedInState = 'logged-in' | 'logged-out' | 'loading' | 'unauthorized'

type AuthStatus = {
  loggedIn: LoggedInState
  loginProvider?: string
}

type AuthStatusResult = {type: 'value'; status: AuthStatus} | {type: 'error'; error: unknown}

const INITIAL_AUTH_STATUS: AuthStatus = {loggedIn: 'loading'}
const INITIAL_AUTH_RESULT: AuthStatusResult = {type: 'value', status: INITIAL_AUTH_STATUS}

export function AuthBoundary({
  children,
  AuthenticateComponent = AuthenticateScreen,
  LoadingComponent = LoadingBlock,
  NotAuthenticatedComponent = NotAuthenticatedScreen,
}: AuthBoundaryProps) {
  const [error, handleError] = useState<unknown>(null)
  if (error) throw error

  // The auth store whose callback flow (sid → credential exchange) has
  // settled. Until the ACTIVE workspace's store has, a logged-out state is
  // ambiguous — it may be the stale pre-exchange probe result — so the
  // render below holds the loading screen instead of flashing the login
  // screen. Store identity rather than a boolean, so a workspace switch
  // mid-exchange keeps the gate closed for the new workspace and a
  // superseded exchange settling late can't open it.
  const [callbackSettledFor, setCallbackSettledFor] = useState<AuthStore | undefined>(undefined)
  const {activeWorkspace} = useActiveWorkspace()
  const callbackSettled =
    !activeWorkspace.auth.handleCallbackUrl || callbackSettledFor === activeWorkspace.auth
  const telemetry = useTelemetry()
  const [mountTime] = useState(() => performance.now())

  const authStatus$ = useMemo(
    () =>
      activeWorkspace.auth.state.pipe(
        map(({authenticated, currentUser}): AuthStatusResult => {
          /**
           * If a user has never had any roles on for the given workspace project
           * e.g. because they've only ever been an organization member thereby
           * giving them implicit access to the studio then they will have no roles
           * array on their user so to account for this case or the case that they have
           * had roles removed then we need to set the logged in state to unauthorized.
           */
          if (
            authenticated &&
            (!Array.isArray(currentUser?.roles) || currentUser.roles.length === 0)
          ) {
            return {
              type: 'value',
              status: {
                loggedIn: 'unauthorized',
                loginProvider: currentUser?.provider,
              },
            }
          }

          return {
            type: 'value',
            status: {loggedIn: authenticated ? 'logged-in' : 'logged-out'},
          }
        }),
        catchError((err: unknown) => of({type: 'error' as const, error: err})),
      ),
    [activeWorkspace],
  )

  // Kept synchronous: this gates authenticated children and is compared with
  // the live `callbackSettled` state — a deferred snapshot could keep children
  // mounted after logout or pair stale `loggedIn` with fresh settlement state.
  const authResult = useSyncObservable(authStatus$, INITIAL_AUTH_RESULT)
  if (authResult.type === 'error') throw authResult.error

  const {loggedIn, loginProvider} = authResult.status

  // AuthBoundaryResolved: mount-baseline — measures time from this component
  // mounting to auth state resolving. Fires every transition out of 'loading'.
  useEffect(() => {
    if (loggedIn !== 'loading') {
      telemetry.log(AuthBoundaryResolved, {
        durationMs: Math.round(performance.now() - mountTime),
        result: loggedIn,
      })
    }
  }, [loggedIn, telemetry, mountTime])

  // StudioAuthReadyMeasured: navigation-start baseline — measures time from
  // performance.timeOrigin (pairs with web-vitals metrics like LCP/FCP).
  // One-shot via module-level guard.
  useEffect(() => {
    if (authReadyFired) return
    if (loggedIn === 'loading') return
    authReadyFired = true
    const durationMs = performance.now()
    telemetry.log(StudioAuthReadyMeasured, {
      durationMs,
      authState: loggedIn,
      ...getPageVisibilitySnapshot(durationMs),
    })
  }, [loggedIn, telemetry])

  useEffect(() => {
    const auth = activeWorkspace.auth
    // A superseded run (workspace switched away, or StrictMode's first
    // invocation) must not write: a stale store settling late would
    // overwrite the ACTIVE store's settled marker and re-close the gate,
    // stranding a logged-out user on the loading screen.
    let superseded = false
    auth
      .handleCallbackUrl?.()
      .then((result) => {
        telemetry.log(SessionTokenExchangeCompleted, result)
      })
      .catch(handleError)
      .finally(() => {
        if (!superseded) setCallbackSettledFor(auth)
      })
    return () => {
      superseded = true
    }
  }, [activeWorkspace.auth, telemetry])

  if (loggedIn === 'loading') return <LoadingComponent />

  if (loggedIn === 'unauthorized') {
    // If using unverified `sanity` login provider, send them
    // to basic NotAuthorized component.
    if (!loginProvider || loginProvider === 'sanity') return <NotAuthenticatedComponent />
    // Otherwise, send user to request access screen
    return <RequestAccessScreen />
  }

  // While the callback exchange is unsettled, logged-out may be the stale
  // pre-exchange state — rendering the login screen on it is the flash this
  // gate prevents. handleCallbackUrl resolves only after the state reflects
  // the exchange, so once the gate opens, `loggedIn` can be trusted.
  if (loggedIn === 'logged-out' && !callbackSettled) return <LoadingComponent />

  if (loggedIn === 'logged-out') return <AuthenticateComponent />

  return <>{children}</>
}
