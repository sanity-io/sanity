/* eslint-disable i18next/no-literal-string */
/* eslint-disable @sanity/i18n/no-attribute-string-literals */
import {
  Card,
  Code,
  Container,
  ErrorBoundary,
  type ErrorBoundaryProps,
  Heading,
  Stack,
} from '@sanity/ui'
import {type ErrorInfo, type ReactNode, useCallback, useState} from 'react'
import {useHotModuleReload} from 'use-hot-module-reload'

import {Button} from '../../ui-components'
import {SchemaError} from '../config'
import {errorReporter} from '../error/errorReporter'
import {CorsOriginError} from '../store'
import {isRecord} from '../util'
import {CorsOriginErrorScreen, SchemaErrorsScreen} from './screens'

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

export function StudioErrorBoundary({
  children,
  heading = 'An error occured',
}: StudioErrorBoundaryProps) {
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

  if (!error) {
    return <ErrorBoundary onCatch={handleCatchError}>{children}</ErrorBoundary>
  }

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

          <Heading>{heading}</Heading>

          <div>
            <Button onClick={handleResetError} text="Retry" tone="default" />
          </div>

          <Card border radius={2} overflow="auto" padding={4} tone="inherit">
            <Stack space={4}>
              {message && (
                <Code size={1}>
                  <strong>Error: {message}</strong>
                </Code>
              )}
              {stack && <Code size={1}>{stack}</Code>}
              {eventId && <Code size={1}>Event ID: {eventId}</Code>}
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Card>
  )
}
