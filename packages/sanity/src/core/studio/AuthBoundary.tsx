import {useTelemetry} from '@sanity/telemetry/react'
import {type ComponentType, type ReactNode, useEffect, useState} from 'react'

import {LoadingBlock} from '../components/loadingBlock'
import {
  AuthBoundaryResolved,
  SessionTokenExchangeCompleted,
} from './__telemetry__/authBoundary.telemetry'
import {useActiveWorkspace} from './activeWorkspaceMatcher'
import {AuthenticateScreen, NotAuthenticatedScreen, RequestAccessScreen} from './screens'

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
  const telemetry = useTelemetry()
  const [mountTime] = useState(() => performance.now())
  useEffect(() => {
    if (loggedIn !== 'loading') {
      telemetry.log(AuthBoundaryResolved, {
        durationMs: Math.round(performance.now() - mountTime),
        result: loggedIn,
      })
    }
  }, [loggedIn, telemetry, mountTime])

  useEffect(() => {
    activeWorkspace.auth
      .handleCallbackUrl?.()
      .then((result) => {
        telemetry.log(SessionTokenExchangeCompleted, result)
      })
      .catch(handleError)
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

  // NOTE: there is currently a bug where the `AuthenticateComponent` will
  // flash after the first login with cookieless mode. See `createAuthStore`
  // for details
  if (loggedIn === 'logged-out') return <AuthenticateComponent />

  return <>{children}</>
}
