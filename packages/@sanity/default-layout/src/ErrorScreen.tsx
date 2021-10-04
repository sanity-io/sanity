import React from 'react'
import {Box, Card, Code, Container, Stack, Heading, Text} from '@sanity/ui'
import {ErrorAccordion} from './main/ErrorAccordion'

declare const __DEV__: boolean

interface ErrorScreenProps {
  description?: React.ReactNode
  error: Error
  title?: React.ReactNode
}

function getErrorWithStack(err: Error) {
  const stack = err.stack || ''
  const message = err.message

  return stack.indexOf(message) === -1 ? `${message}\n\n${stack}` : stack
}

function limitStackLength(stack: string) {
  return stack.split('\n').slice(0, 15).join('\n')
}

function formatStack(stack: string) {
  return (
    stack
      // Prettify builder functions
      .replace(/\(\.\.\.\)\./g, '(...)\n  .')
      // Remove webpack cruft from function names
      .replace(/__WEBPACK_IMPORTED_MODULE_\d+_+/g, '')
      // Remove default export postfix from function names
      .replace(/___default\./g, '.')
      // Replace full host path, leave only path to JS-file
      .replace(new RegExp(` \\(https?:\\/\\/${window.location.host}`, 'g'), ' (')
  )
}

export function ErrorScreen(props: ErrorScreenProps) {
  const {description, error, title} = props

  return (
    <Card
      height="fill"
      paddingX={[3, 4, 5, 7]}
      paddingY={[5, 5, 6]}
      sizing="border"
      overflow="auto"
    >
      <Container>
        <Stack space={4}>
          <Heading as="h1">{title || <>Unknown error</>}</Heading>

          {description && (
            <Text as="p" muted>
              {description}
            </Text>
          )}
        </Stack>

        {__DEV__ && (
          <Box marginTop={5}>
            {error.stack ? (
              <ErrorAccordion open={__DEV__} title="Stack trace">
                <Code size={1}>{formatStack(limitStackLength(getErrorWithStack(error)))}</Code>
              </ErrorAccordion>
            ) : (
              <ErrorAccordion open={__DEV__} title="Error">
                <Code size={1}>{error.message}</Code>
              </ErrorAccordion>
            )}
          </Box>
        )}
      </Container>
    </Card>
  )
}
