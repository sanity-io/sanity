import {
  Card,
  Container,
  ErrorBoundary,
  type ErrorBoundaryProps,
  Heading,
  Stack,
  useToast,
} from '@sanity/ui'
import {type ErrorInfo, useCallback, useEffect, useRef, useState} from 'react'

import {errorReporter} from '../error/errorReporter'

console.log('LOADED DEV SERVER STATUS')

export const useDetectDevServerDisconnect = () => {
  const [serverStopped, setServerStopped] = useState(false)
  const serverIsReadyRef = useRef(false)

  useEffect(() => {
    const url = `ws://${window.location.hostname}:${window.location.port}/`
    const ws = new WebSocket(url, 'vite-hmr')

    ws.onclose = () => {
      if (!serverIsReadyRef.current) return
      setServerStopped(true)
    }
    ws.onopen = () => {
      if (!serverIsReadyRef.current) {
        serverIsReadyRef.current = true
      }

      setServerStopped(false)
    }

    return () => ws.close()
  }, [])

  return serverStopped
}

const DevServerStatusToast = ({
  onServerStateChange,
}: {
  onServerStateChange?: (isServerRunning: boolean) => void
}) => {
  const serverStopped = useDetectDevServerDisconnect()

  const toast = useToast()

  useEffect(() => {
    onServerStateChange?.(serverStopped)
  }, [onServerStateChange, serverStopped])

  useEffect(() => {
    if (serverStopped) {
      toast.push({
        id: 'dev-server-stopped',
        duration: 60000,
        closable: true,
        status: 'error',
        title: 'Dev server stopped',
        description:
          'The development server has stopped. You may need to restart it to continue working.',
      })
    }
  }, [serverStopped, toast])

  return null
}

type ErrorBoundaryState =
  | {
      componentStack: null
      error: null
      eventId: null
    }
  | {
      componentStack: ErrorInfo['componentStack']
      error: Error
      eventId: string | null
    }

export class DevServerStopError extends Error {
  constructor() {
    super('DevServerStopError')
    this.name = 'DevServerStopError'
  }
}

const INITIAL_STATE = {
  componentStack: null,
  error: null,
  eventId: null,
} satisfies ErrorBoundaryState

const DevServerStatusThrower = () => {
  const serverStopped = useDetectDevServerDisconnect()

  if (serverStopped) {
    throw new DevServerStopError()
  }

  return null
}

export const DevServerStatusError = ({
  children,
}: React.PropsWithChildren<{
  onServerStateChange?: (isServerRunning: boolean) => void
}>) => {
  const serverStopped = useDetectDevServerDisconnect()
  const [{error, eventId}, setError] = useState<ErrorBoundaryState>(INITIAL_STATE)

  const handleCatchError: ErrorBoundaryProps['onCatch'] = useCallback(
    (params) => {
      const report = errorReporter.reportError(params.error, {
        reactErrorInfo: params.info,
        errorBoundary: 'StudioErrorBoundary',
      })

      if (serverStopped) {
        setError({
          error: params.error,
          componentStack: params.info.componentStack,
          eventId: report?.eventId || null,
        })
      } else {
        throw params.error
      }
    },
    [serverStopped],
  )

  if (error instanceof DevServerStopError) {
    return (
      <Card
        height="fill"
        overflow="auto"
        paddingY={[4, 5, 6, 7]}
        paddingX={4}
        sizing="border"
        tone="critical"
      >
        <Container width={3}>
          <Stack space={4}>
            {/* TODO: better error boundary */}
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <Heading>Dev server stopped</Heading>
            <Card border radius={2} overflow="auto" padding={4} tone="inherit">
              <Stack space={4} />
            </Card>
          </Stack>
        </Container>
      </Card>
    )
  }

  return (
    <ErrorBoundary onCatch={handleCatchError}>
      <DevServerStatusThrower />
      {children}
    </ErrorBoundary>
  )
}

export default DevServerStatusToast
