import {useTelemetry} from '@sanity/telemetry/react'
import {type ComponentType, type ReactNode, useEffect, useState} from 'react'

import {LoadingBlock} from '../components/loadingBlock'
import {type AuthStore} from '../store'
import {
  AuthBoundaryResolved,
  SessionTokenExchangeCompleted,
} from './__telemetry__/authBoundary.telemetry'
import {StudioAuthReadyMeasured} from './__telemetry__/bootstrap.telemetry'
import {useActiveWorkspace} from './activeWorkspaceMatcher'
import {AuthenticateScreen, NotAuthenticatedScreen, RequestAccessScreen} from './screens'
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

export function AuthBoundary({
  children,
  AuthenticateComponent = AuthenticateScreen,
  LoadingComponent = LoadingBlock,
  NotAuthenticatedComponent = NotAuthenticatedScreen,
}: AuthBoundaryProps) {
  const [error, handleError] = useState<unknown>(null)
  if (error) throw error

  const [loggedIn, setLoggedIn] = useState<'logged-in' | 'logged-out' | 'loading' | 'unauthorized'>(
    'loading',
  )
  const [loginProvider, setLoginProvider] = useState<string | undefined>()
  const {activeWorkspace} = useActiveWorkspace()

  // The auth store whose callback flow (sid → credential exchange) has
  // settled. Until the ACTIVE workspace's store has, a logged-out state is
  // ambiguous — it may be the stale pre-exchange probe result — so the
  // render below holds the loading screen instead of flashing the login
  // screen. Store identity rather than a boolean, so a workspace switch
  // mid-exchange keeps the gate closed for the new workspace and a
  // superseded exchange settling late can't open it.
  const [callbackSettledFor, setCallbackSettledFor] = useState<AuthStore | undefined>(undefined)
  const callbackSettled =
    !activeWorkspace.auth.handleCallbackUrl || callbackSettledFor === activeWorkspace.auth
  const telemetry = useTelemetry()
  const [mountTime] = useState(() => performance.now())

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
    auth
      .handleCallbackUrl?.()
      .then((result) => {
        telemetry.log(SessionTokenExchangeCompleted, result)
      })
      .catch(handleError)
      // Marks THIS store's flow settled; harmless if a workspace switch
      // superseded this run (the identity check above keeps the gate closed).
      .finally(() => setCallbackSettledFor(auth))
  }, [activeWorkspace.auth, telemetry])

  useEffect(() => {
    const subscription = activeWorkspace.auth.state.subscribe({
      next: ({authenticated, currentUser}) => {
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
          setLoggedIn('unauthorized')
          if (currentUser?.provider) setLoginProvider(currentUser.provider)
          return
        }

        setLoggedIn(authenticated ? 'logged-in' : 'logged-out')
      },
      error: handleError,
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [activeWorkspace])

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
