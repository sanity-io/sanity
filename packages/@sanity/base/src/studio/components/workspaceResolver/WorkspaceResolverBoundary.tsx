import React, {useState, useMemo} from 'react'
import styled from 'styled-components'
import {Flex, Box, Heading, Card, Button, ErrorBoundary, Text} from '@sanity/ui'
import {ConfigResolutionError} from '../../../config'
import {WorkspaceResolver} from './WorkspaceResolver'
import {flattenErrors} from './flattenErrors'
import {ErrorMessage} from './ErrorMessage'

const Root = styled(Card).attrs({height: 'fill', overflow: 'auto'})``
const Content = styled(Box).attrs({padding: 4})`
  margin: auto;
  width: 640px;
  max-width: 100%;
`

interface WorkspaceResolverBoundaryProps {
  children: React.ReactNode
  loadingScreen: React.ReactNode
}

export function WorkspaceResolverBoundary(props: WorkspaceResolverBoundaryProps) {
  const [{error}, setError] = useState<{error: unknown}>({error: null})

  const errors = useMemo(() => flattenErrors(error, []), [error])

  if (error instanceof ConfigResolutionError) {
    return (
      <Root forwardedAs={Flex}>
        <Content forwardedAs={Flex} direction="column" gap={4}>
          <Flex direction="column" gap={2}>
            <Box>
              <Heading as="h1">Configuration Error</Heading>
            </Box>
            <Box muted>
              <Text>An error occurred while trying to resolve your Studio's configuration.</Text>
            </Box>
            <Box>
              <Text size={1} muted>
                Note: the design of this page may change.
              </Text>
            </Box>
          </Flex>
          <Card shadow={1}>
            {errors.map((errorInfo, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <ErrorMessage key={index} {...errorInfo} />
            ))}
          </Card>
          <Button
            tone="primary"
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => window.location.reload()}
            type="button"
            text="Retry"
          />
        </Content>
      </Root>
    )
  }

  // otherwise hand off to other boundaries
  if (error) throw error

  return (
    <ErrorBoundary onCatch={setError}>
      <WorkspaceResolver {...props} />
    </ErrorBoundary>
  )
}
