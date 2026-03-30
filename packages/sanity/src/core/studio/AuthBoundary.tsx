/* eslint-disable @sanity/i18n/no-attribute-string-literals */
import {useTelemetry} from '@sanity/telemetry/react'
import {Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {type ComponentType, type ReactNode, useCallback, useEffect, useState} from 'react'

import {Button} from '../../ui-components'
import {LoadingBlock} from '../components/loadingBlock'
import {type HandleCallbackResult} from '../store/_legacy/authStore/types'
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

  const [status, setStatus] = useState<
    'logged-in' | 'logged-out' | 'loading' | 'unauthorized' | 'error'
  >('loading')
  const [authError, setAuthError] = useState<HandleCallbackResult['error']>()
  const [loginProvider, setLoginProvider] = useState<string | undefined>()
  const {activeWorkspace} = useActiveWorkspace()
  const telemetry = useTelemetry()
  const [mountTime] = useState(() => performance.now())
  useEffect(() => {
    if (status !== 'loading') {
      telemetry.log(AuthBoundaryResolved, {
        durationMs: Math.round(performance.now() - mountTime),
        result: status,
      })
    }
  }, [status, telemetry, mountTime])

  useEffect(() => {
    activeWorkspace.auth
      .handleCallbackUrl?.()
      .then((result) => {
        telemetry.log(SessionTokenExchangeCompleted, result)
        if (!result.success && result.error) {
          setAuthError(result.error)
          setStatus('error')
        }
      })
      .catch(handleError)
  }, [activeWorkspace.auth, telemetry])

  useEffect(() => {
    const subscription = activeWorkspace.auth.state.subscribe({
      next: ({authenticated, currentUser}) => {
        setStatus((prev) => {
          // Don't let a state$ emission override the error state - the
          // handleCallbackUrl result takes precedence when auth exchange fails,
          // as state$ may emit 'logged-out' from the broadcast(null) on failure.
          if (prev === 'error') return prev

          if (
            authenticated &&
            (!Array.isArray(currentUser?.roles) || currentUser.roles.length === 0)
          ) {
            if (currentUser?.provider) setLoginProvider(currentUser.provider)
            return 'unauthorized'
          }

          return authenticated ? 'logged-in' : 'logged-out'
        })
      },
      error: handleError,
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [activeWorkspace])

  const handleRetry = useCallback(() => {
    setAuthError(undefined)
    setStatus('logged-out')
  }, [])

  if (status === 'loading') return <LoadingComponent />

  if (status === 'error' && authError) {
    return <AuthErrorScreen error={authError} onRetry={handleRetry} />
  }

  if (status === 'unauthorized') {
    if (!loginProvider || loginProvider === 'sanity') return <NotAuthenticatedComponent />
    return <RequestAccessScreen />
  }

  if (status === 'logged-out') return <AuthenticateComponent />

  return <>{children}</>
}

function AuthErrorScreen({
  error,
  onRetry,
}: {
  error: NonNullable<HandleCallbackResult['error']>
  onRetry: () => void
}) {
  const heading = error.type === 'cookie-blocked' ? 'Cookies blocked' : 'Authentication failed'

  return (
    <Card height="fill">
      <Flex align="center" justify="center" height="fill" padding={4}>
        <Stack space={4} style={{maxWidth: 400}}>
          <Heading as="h1" size={1}>
            {heading}
          </Heading>
          <Text muted size={1}>
            {error.message}
          </Text>
          {error.type === 'auth-failed' && (
            <Button text="Try again" tone="default" onClick={onRetry} size="large" />
          )}
        </Stack>
      </Flex>
    </Card>
  )
}
