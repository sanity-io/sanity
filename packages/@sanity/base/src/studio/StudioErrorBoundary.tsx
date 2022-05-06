import React, {useState} from 'react'
import {Button, Card, Code, ErrorBoundary, Heading, Stack} from '@sanity/ui'
import {SchemaError} from '../config'
import {isRecord} from '../util'
import {SchemaErrorsScreen} from './screens'

interface StudioErrorBoundaryProps {
  children: React.ReactNode
}

export function StudioErrorBoundary({children}: StudioErrorBoundaryProps) {
  const [{error}, setError] = useState<{error: unknown}>({error: null})

  const message = isRecord(error) && typeof error.message === 'string' && error.message
  const stack = isRecord(error) && typeof error.stack === 'string' && error.stack

  if (error instanceof SchemaError) {
    return <SchemaErrorsScreen schema={error.schema} />
  }

  if (error) {
    return (
      <Card padding={4} tone="critical">
        <Stack space={4}>
          {/* TODO: better error boundary */}

          <Heading>An error occurred</Heading>

          <div>
            <Button
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => setError({error: null})}
              text="Retry"
              tone="default"
            />
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
      </Card>
    )
  }

  return <ErrorBoundary onCatch={setError}>{children}</ErrorBoundary>
}
