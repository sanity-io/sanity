import generateHelpUrl from '@sanity/generate-help-url'
import {SerializeError} from '@sanity/structure'
import {Box, Card, Code, Container, Heading, Label, Stack, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

export interface StructureErrorProps {
  error: {
    message: string
    stack: string
    path?: Array<string | number>
    helpId?: string
  }
}

const PathSegment = styled.span`
  &:not(:last-child)::after {
    content: ' ➝ ';
    opacity: 0.5;
  }
`

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

export function StructureError(props: StructureErrorProps) {
  const {path = [], helpId, message, stack} = props.error

  // Serialize errors are well-formatted and should be readable, in these cases a stack trace is
  // usually not helpful. Build errors in dev (with HMR) usually also contains a bunch of garbage
  // instead of an actual error message, so make sure we show the message in these cases as well
  const showStack =
    !(props.error instanceof SerializeError) && !message.includes('Module build failed:')

  return (
    <Card height="fill" overflow="auto" padding={4} sizing="border" tone="critical">
      <Container>
        <Heading as="h2">Encountered an error while reading structure</Heading>

        <Card marginTop={4} padding={4} radius={2} overflow="auto" shadow={1} tone="inherit">
          {path.length > 0 && (
            <Stack space={2}>
              <Label>Structure path</Label>
              <Code>
                {path.map((segment, i) => (
                  <PathSegment key={i}>{segment}</PathSegment>
                ))}
              </Code>
            </Stack>
          )}

          <Stack marginTop={4} space={2}>
            <Label>Error</Label>
            <Code>{showStack ? formatStack(stack) : message}</Code>
          </Stack>

          {helpId && (
            <Box marginTop={4}>
              <Text>
                <a href={generateHelpUrl(helpId)} rel="noopener noreferrer" target="_blank">
                  View documentation
                </a>
              </Text>
            </Box>
          )}
        </Card>
      </Container>
    </Card>
  )
}
