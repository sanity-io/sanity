import {type ComponentType, type ReactNode, useEffect, useState} from 'react'

import {LoadingBlock} from '../components/loadingBlock'
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

  useEffect(() => {
    activeWorkspace.auth.handleCallbackUrl?.().catch(handleError)
  }, [activeWorkspace.auth])

  useEffect(() => {
    const subscription = activeWorkspace.auth.state.subscribe({
      next: ({authenticated, currentUser}) => {
        if (currentUser?.roles?.length === 0) {
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
