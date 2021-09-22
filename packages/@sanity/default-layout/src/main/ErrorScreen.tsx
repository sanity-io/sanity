import React from 'react'
import {Card, Code, Container, Stack, Button, Heading, Flex, Text} from '@sanity/ui'
import {SyncIcon} from '@sanity/icons'
import {ErrorAccordion} from '.'

interface Props {
  activeTool?: {
    name: string
    title: string
  }
  error: {
    message: string
    stack: string
  }
  info: {
    componentStack: string
  }
  onRetry: () => void
  showErrorDetails: boolean
}

function getErrorWithStack(err: {message: string; stack: string}) {
  const stack = err.stack.toString()
  const message = err.message
  return stack.indexOf(message) === -1 ? `${message}\n\n${stack}` : stack
}

function limitStackLength(stack: string) {
  return stack.split('\n').slice(0, 15).join('\n')
}

function formatStack(stack) {
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

export function ErrorScreen(props: Props) {
  const {activeTool, error, info, onRetry, showErrorDetails} = props
  const toolName = (activeTool && (activeTool.title || activeTool.name)) || 'active'

  return (
    <Card
      height="fill"
      paddingX={[3, 4, 5, 7]}
      paddingY={[5, 5, 6]}
      sizing="border"
      overflow="auto"
    >
      <Container>
        <Stack space={5}>
          <Heading>
            The <i>{toolName}</i> tool crashed
          </Heading>
          <Stack space={4}>
            <Text muted>
              An uncaught exception in the <i>{toolName}</i> tool caused the Studio to crash.
            </Text>
            <Flex>
              <Button text="Retry" icon={SyncIcon} tone="primary" onClick={onRetry} />
            </Flex>
          </Stack>
          {showErrorDetails && (
            <>
              <Stack space={4}>
                {error.stack ? (
                  <ErrorAccordion title="Stack trace">
                    <Code size={1}>{formatStack(limitStackLength(getErrorWithStack(error)))}</Code>
                  </ErrorAccordion>
                ) : (
                  <ErrorAccordion title="Error">
                    <Code size={1}>{error.message}</Code>
                  </ErrorAccordion>
                )}
                {info && info.componentStack && (
                  <ErrorAccordion title="Component stack">
                    <Code size={1}>{info.componentStack.replace(/^\s*\n+/, '')}</Code>
                  </ErrorAccordion>
                )}
              </Stack>
            </>
          )}
        </Stack>
      </Container>
    </Card>
  )
}
