/* eslint-disable i18next/no-literal-string */
/* eslint-disable @sanity/i18n/no-attribute-string-literals */
import React, {useCallback, useState} from 'react'
import {Card, Code, Container, ErrorBoundary, Heading, Stack} from '@sanity/ui'
import {useHotModuleReload} from 'use-hot-module-reload'
import {Button} from '../../ui'
import {SchemaError} from '../config'
import {isRecord} from '../util'
import {CorsOriginError} from '../store'
import {CorsOriginErrorScreen, SchemaErrorsScreen} from './screens'

interface StudioErrorBoundaryProps {
  children: React.ReactNode
  heading?: string
}

export function StudioErrorBoundary({
  children,
  heading = 'An error occured',
}: StudioErrorBoundaryProps) {
  const [{error}, setError] = useState<{error: unknown}>({error: null})

  const message = isRecord(error) && typeof error.message === 'string' && error.message
  const stack = isRecord(error) && typeof error.stack === 'string' && error.stack

  const handleResetError = useCallback(() => setError({error: null}), [setError])

  useHotModuleReload(handleResetError)

  if (error instanceof CorsOriginError) {
    return <CorsOriginErrorScreen projectId={error?.projectId} />
  }

  if (error instanceof SchemaError) {
    return <SchemaErrorsScreen schema={error.schema} />
  }

  if (!error) {
    return <ErrorBoundary onCatch={setError}>{children}</ErrorBoundary>
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
            </Stack>
          </Card>
        </Stack>
      </Container>
    </Card>
  )
}
