import React, {useEffect, useState} from 'react'
import {LoadingScreen, AuthenticateScreen, NotAuthenticatedScreen} from './screens'
import {useActiveWorkspace} from './activeWorkspaceMatcher'

interface AuthBoundaryProps {
  children: React.ReactNode
  AuthenticateComponent?: React.ComponentType
  LoadingComponent?: React.ComponentType
  NotAuthenticatedComponent?: React.ComponentType
}

export function AuthBoundary({
  children,
  AuthenticateComponent = AuthenticateScreen,
  LoadingComponent = LoadingScreen,
  NotAuthenticatedComponent = NotAuthenticatedScreen,
}: AuthBoundaryProps) {
  const [error, handleError] = useState<unknown>(null)
  if (error) throw error

  const [loggedIn, setLoggedIn] = useState<'logged-in' | 'logged-out' | 'loading' | 'unauthorized'>(
    'loading'
  )
  const {activeWorkspace} = useActiveWorkspace()

  useEffect(() => {
    activeWorkspace.auth.handleCallbackUrl?.().catch(handleError)
  }, [activeWorkspace.auth])

  useEffect(() => {
    const subscription = activeWorkspace.auth.state.subscribe({
      next: ({authenticated, currentUser}) => {
        if (currentUser?.roles?.length === 0) {
          setLoggedIn('unauthorized')

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

  if (loggedIn === 'unauthorized') return <NotAuthenticatedComponent />

  // NOTE: there is currently a bug where the `AuthenticateComponent` will
  // flash after the first login with cookieless mode. See `createAuthStore`
  // for details
  if (loggedIn === 'logged-out') return <AuthenticateComponent />

  return <>{children}</>
}
