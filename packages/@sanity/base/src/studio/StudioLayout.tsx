import {Box, Button, Card, Code, ErrorBoundary, Flex, Heading, Spinner} from '@sanity/ui'
import React, {createElement, Suspense, useCallback, useEffect, useState} from 'react'
import {RouteScope, useRouter} from '../router'
import {Navbar} from './components'
import {useWorkspace} from './workspace'

export function StudioLayout() {
  const {state: routerState} = useRouter()
  const {tools} = useWorkspace()
  const activeToolName = typeof routerState.tool === 'string' ? routerState.tool : undefined
  const activeTool = tools.find((tool) => tool.name === activeToolName)
  const [toolError, setToolError] = useState<{error: Error; info: React.ErrorInfo} | null>(null)

  useEffect(() => {
    setToolError(null)
  }, [activeToolName])

  const handleToolRetry = useCallback(() => {
    setToolError(null)
  }, [])

  return (
    <Flex data-ui="ToolScreen" direction="column" height="fill">
      <Navbar activeToolName={activeToolName} />

      {!activeTool && (
        <Card flex={1} overflow="auto" padding={4}>
          <Heading as="h1">
            No tool: <code>{activeToolName}</code>
          </Heading>
        </Card>
      )}

      {toolError && activeTool && (
        <Card flex={1} overflow="auto" padding={4}>
          <Heading as="h1">
            The <code>{activeToolName}</code> tool crashed
          </Heading>
          <Box marginTop={4}>
            <Button onClick={handleToolRetry} text="Retry" />
          </Box>
          <Card marginTop={4} overflow="auto" padding={3} tone="critical">
            <Code size={1}>{toolError.error.stack}</Code>
          </Card>
          <Card marginTop={4} overflow="auto" padding={3} tone="critical">
            <Code size={1}>{toolError.info.componentStack}</Code>
          </Card>
        </Card>
      )}

      <Card flex={1}>
        {!toolError && activeTool && activeToolName && (
          <RouteScope scope={activeToolName}>
            <ErrorBoundary onCatch={setToolError}>
              <Suspense fallback={<LoadingTool />}>
                {createElement(activeTool.component, {tool: activeTool})}
              </Suspense>
            </ErrorBoundary>
          </RouteScope>
        )}
      </Card>
    </Flex>
  )
}

function LoadingTool() {
  return (
    <Flex align="center" height="fill" justify="center">
      <Spinner muted />
    </Flex>
  )
}
