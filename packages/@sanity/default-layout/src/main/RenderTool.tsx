// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {createElement, memo, useCallback, useEffect, useRef, useState} from 'react'
import {Box, Card, Container, ErrorBoundary, Heading, Stack, Text} from '@sanity/ui'
import tools from 'all:part:@sanity/base/tool'
import {RenderToolErrorScreen} from './ErrorScreen'

declare const __DEV__: boolean

const defaultUnknownError = {
  message: 'An unknown error occurred while rendering',
}

interface Props {
  tool: string
}

export const RenderTool = memo(function RenderTool(props: Props) {
  const {tool: activeToolName} = props
  const activeToolNameRef = useRef(activeToolName)
  const activeTool = tools.find((tool) => tool.name === activeToolName)
  const [state, setState] = useState({error: null, showErrorDetails: __DEV__})

  useEffect(() => {
    const prevToolName = activeToolNameRef.current

    if (state.error && prevToolName !== activeToolName) {
      // reset error state
      setState({error: null, showErrorDetails: __DEV__})
    }
  }, [activeToolName, state.error])

  const handleCatch = useCallback((errorParams: {error: Error; info: React.ErrorInfo}) => {
    setState((prevState) => ({...prevState, error: errorParams}))
  }, [])

  const handleRetry = useCallback(() => {
    setState((prevState) => ({...prevState, error: null}))
  }, [])

  if (state.error) {
    const {error, info} = state.error
    const {showErrorDetails} = state

    return (
      <RenderToolErrorScreen
        activeTool={activeTool}
        // Some (rare) errors don't seem to have any Error instance attached
        // In these cases, default to an error-like object with a generic message
        error={error || defaultUnknownError}
        info={info}
        onRetry={handleRetry}
        showErrorDetails={showErrorDetails}
      />
    )
  }

  if (!tools.length) {
    return (
      <Card height="fill" paddingX={[5, 5, 7]} paddingY={[5, 5, 6]} sizing="border">
        <Container>
          <Box marginBottom={5}>
            <Heading as="h1">No available tools</Heading>
          </Box>

          <Stack space={4}>
            <Text muted>
              No tools implement the <code>part:@sanity/base/tool</code>, so there is nothing to
              display.
            </Text>
          </Stack>
        </Container>
      </Card>
    )
  }

  if (!activeTool) {
    return (
      <Card height="fill" paddingX={[5, 5, 7]} paddingY={[5, 5, 6]} sizing="border">
        <Container>
          <Box marginBottom={5}>
            <Heading as="h1">
              Tool not found: <code>{props.tool}</code>
            </Heading>
          </Box>

          <Stack space={4}>
            <Text muted>
              The list of tools installed in this Studio does not include <code>{props.tool}</code>
            </Text>
          </Stack>
        </Container>
      </Card>
    )
  }

  return (
    <ErrorBoundary onCatch={handleCatch}>
      {createElement(activeTool.component, {tool: props.tool})}
    </ErrorBoundary>
  )
})
