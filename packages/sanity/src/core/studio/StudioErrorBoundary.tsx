/* eslint-disable i18next/no-literal-string */
/* eslint-disable @sanity/i18n/no-attribute-string-literals */
import {Box, Card, Code, Container, type ErrorBoundaryProps, Heading, Stack, Text} from '@sanity/ui'
import {isObject} from 'lodash'
import {
  type ComponentType,
  type ErrorInfo,
  lazy,
  type ReactNode,
  useCallback,
  useState,
} from 'react'
import {styled} from 'styled-components'
import {useHotModuleReload} from 'use-hot-module-reload'

import {ErrorBoundary} from '../../ui-components'
import {ErrorActions} from '../components/errorActions/ErrorActions'
import {SchemaError} from '../config'
import {isDev, isProd} from '../environment'
import {errorReporter} from '../error/errorReporter'
import {CorsOriginError} from '../store'
import {isRecord} from '../util'
import {CorsOriginErrorScreen, SchemaErrorsScreen} from './screens'

/**
 * The DevServerStoppedErrorScreen will always have been lazy loaded to client
 * in instances where it is used, since DevServerStoppedError is only thrown
 * when this module is loaded, and this screen is also conditional on this error type
 */
const DevServerStoppedErrorScreen = lazy(() =>
  import('./ViteDevServerStopped').then((DevServerStopped) => ({
    default: DevServerStopped.DevServerStoppedErrorScreen,
  })),
)

interface StudioErrorBoundaryProps {
  children: ReactNode
  heading?: string
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

const INITIAL_STATE = {
  componentStack: null,
  error: null,
  eventId: null,
} satisfies ErrorBoundaryState

const View = styled(Box)`
  align-items: center;
`

export const StudioErrorBoundary: ComponentType<StudioErrorBoundaryProps> = ({
  children,
  heading = 'An error occurred',
}) => {
  const [{error, eventId}, setError] = useState<ErrorBoundaryState>(INITIAL_STATE)
  const message = isRecord(error) && typeof error.message === 'string' && error.message
  const stack = isRecord(error) && typeof error.stack === 'string' && error.stack
  const handleResetError = useCallback(() => setError(INITIAL_STATE), [])
  const handleCatchError: ErrorBoundaryProps['onCatch'] = useCallback((params) => {
    const report = errorReporter.reportError(params.error, {
      reactErrorInfo: params.info,
      errorBoundary: 'StudioErrorBoundary',
    })

    setError({
      error: params.error,
      componentStack: params.info.componentStack,
      eventId: report?.eventId || null,
    })
  }, [])

  useHotModuleReload(handleResetError)

  if (error instanceof CorsOriginError) {
    return <CorsOriginErrorScreen projectId={error?.projectId} />
  }

  if (error instanceof SchemaError) {
    return <SchemaErrorsScreen schema={error.schema} />
  }

  if (
    error &&
    isObject(error) &&
    'ViteDevServerStoppedError' in error &&
    error.ViteDevServerStoppedError
  ) {
    return <DevServerStoppedErrorScreen />
  }

  if (!error) {
    return <ErrorBoundary onCatch={handleCatchError}>{children}</ErrorBoundary>
  }

  return (
    <Card height="fill" overflow="auto" paddingY={[4, 5, 6, 7]} paddingX={4} sizing="border">
      <View display="flex" height="fill">
        <Container width={3}>
          <Stack space={6}>
            <Stack space={4}>
              <Heading>{heading}</Heading>
              <Text>An error occurred that Sanity Studio was unable to recover from.</Text>
              {isProd && (
                <Text>
                  <strong>To report this error,</strong> copy the error details and share them with
                  your development team or Sanity Support.
                </Text>
              )}
              {isDev && (
                <Card border radius={2} overflow="auto" padding={4} tone="critical">
                  <Stack space={4}>
                    {message && (
                      <Code weight={'bold'} size={1}>
                        {message}
                      </Code>
                    )}
                    {stack && <Code size={1}>{stack}</Code>}
                    {eventId && <Code size={1}>Event ID: {eventId}</Code>}
                  </Stack>
                </Card>
              )}
            </Stack>
            <ErrorActions error={error} eventId={eventId} onRetry={handleResetError} size="large" />
          </Stack>
        </Container>
      </View>
    </Card>
  )
}
