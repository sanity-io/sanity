import React, {useCallback, useEffect, useState} from 'react'
import {Button, Card, Code, Container, ErrorBoundary, Heading, Stack, useToast} from '@sanity/ui'
import {useHotModuleReload} from 'use-hot-module-reload'
import {SchemaError} from '../config'
import {globalScope, isRecord} from '../util'
import {CorsOriginError} from '../../_unstable/datastores'
import {CorsOriginErrorScreen, SchemaErrorsScreen} from './screens'

interface StudioErrorBoundaryProps {
  children: React.ReactNode
}

const errorChannel = globalScope.__sanityErrorChannel

function isKnownError(err: Error): boolean {
  if (err instanceof SchemaError) {
    return true
  }

  if (err instanceof CorsOriginError) {
    return true
  }

  return false
}

export function StudioErrorBoundary({children}: StudioErrorBoundaryProps) {
  const [{error}, setError] = useState<{error: unknown}>({error: null})
  const {push: pushToast} = useToast()

  const message = isRecord(error) && typeof error.message === 'string' && error.message
  const stack = isRecord(error) && typeof error.stack === 'string' && error.stack

  const handleResetError = useCallback(() => setError({error: null}), [setError])

  useHotModuleReload(handleResetError)

  useEffect(() => {
    if (!errorChannel) return undefined

    return errorChannel.subscribe((msg) => {
      // NOTE: Certain errors (such as the `ResizeObserver loop limit exceeded` error) is thrown
      // by the browser, and does not include an `error` property. We ignore these errors.
      if (!msg.error) {
        return
      }

      // For errors that we "expect", eg have specific error screens for, do not push a toast
      if (isKnownError(msg.error)) {
        return
      }

      console.error(msg.error)

      pushToast({
        closable: true,
        description: msg.error.message,
        duration: 5000,
        title: 'Uncaught error',
        status: 'error',
      })
    })
  }, [pushToast])

  if (error instanceof CorsOriginError) {
    return <CorsOriginErrorScreen projectId={error?.projectId} />
  }

  if (error instanceof SchemaError) {
    return <SchemaErrorsScreen schema={error.schema} />
  }

  if (error) {
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

            <Heading>An error occurred</Heading>

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
              </Stack>
            </Card>
          </Stack>
        </Container>
      </Card>
    )
  }

  return <ErrorBoundary onCatch={setError}>{children}</ErrorBoundary>
}
