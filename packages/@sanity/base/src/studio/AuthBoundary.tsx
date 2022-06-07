import React, {useEffect, useState} from 'react'
import {LoadingScreen, NotAuthenticatedScreen} from './screens'
import {useActiveWorkspace} from './activeWorkspaceMatcher'

interface AuthBoundaryProps {
  children: React.ReactNode
  NotAuthenticatedComponent?: React.ComponentType
  LoadingComponent?: React.ComponentType
}

export function AuthBoundary({
  children,
  NotAuthenticatedComponent = NotAuthenticatedScreen,
  LoadingComponent = LoadingScreen,
}: AuthBoundaryProps) {
  const [error, handleError] = useState<unknown>(null)
  if (error) throw error

  const [loggedIn, setLoggedIn] = useState<'logged-in' | 'logged-out' | 'loading'>('loading')
  const {activeWorkspace} = useActiveWorkspace()

  useEffect(() => {
    activeWorkspace.auth.handleCallbackUrl?.().catch(handleError)
  }, [activeWorkspace.auth])

  useEffect(() => {
    activeWorkspace.auth.state.subscribe({
      next: ({authenticated}) => setLoggedIn(authenticated ? 'logged-in' : 'logged-out'),
      error: handleError,
    })
  }, [activeWorkspace])

  if (loggedIn === 'loading') return <LoadingComponent />
  // NOTE: there is currently a bug where the `NotAuthenticatedComponent` will
  // flash after the first login with cookieless mode. See `createAuthStore`
  // for details
  if (loggedIn === 'logged-out') return <NotAuthenticatedComponent />

  return <>{children}</>
}
