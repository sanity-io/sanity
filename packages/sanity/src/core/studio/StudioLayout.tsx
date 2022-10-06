import {Box, Button, Card, Code, ErrorBoundary, Flex, Heading, Spinner} from '@sanity/ui'
import {startCase} from 'lodash'
import React, {
  createContext,
  createElement,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import styled from 'styled-components'
import {useHotModuleReload} from 'use-hot-module-reload'
import {NoToolsScreen} from './screens/NoToolsScreen'
import {ToolNotFoundScreen} from './screens/ToolNotFoundScreen'
import {useNavbarComponent} from './studio-components-hooks'
import {useWorkspace} from './workspace'
import {RouteScope, useRouter} from 'sanity/router'

const SearchFullscreenPortalCard = styled(Card)`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  flex: 1;
`

/** @internal */
export interface NavbarContextValue {
  onSearchOpenChange: (open: boolean) => void
  fullscreenSearchPortalEl: HTMLElement | null
}

/** @internal */
export const NavbarContext = createContext<NavbarContextValue>({
  fullscreenSearchPortalEl: null,
  onSearchOpenChange: () => '',
})

/** @public */
export function StudioLayout() {
  const {state: routerState} = useRouter()
  const {name, title, tools} = useWorkspace()
  const activeToolName = typeof routerState.tool === 'string' ? routerState.tool : undefined
  const activeTool = tools.find((tool) => tool.name === activeToolName)
  const [toolError, setToolError] = useState<{error: Error; info: React.ErrorInfo} | null>(null)
  const [searchOpen, setSearchOpen] = useState<boolean>(false)
  const [fullscreenSearchPortalEl, setFullscreenSearchPortalEl] = useState<HTMLDivElement | null>(
    null
  )

  const documentTitle = useMemo(() => {
    const mainTitle = title || startCase(name)

    if (activeToolName) {
      return `${mainTitle} – ${startCase(activeToolName)}`
    }

    return mainTitle
  }, [activeToolName, name, title])

  useEffect(() => {
    document.title = documentTitle
  }, [documentTitle])

  const handleSearchOpenChange = useCallback((open: boolean) => {
    setSearchOpen(open)
  }, [])

  const resetToolError = useCallback(() => setToolError(null), [setToolError])

  useEffect(resetToolError, [activeToolName, resetToolError])
  useHotModuleReload(resetToolError)

  const navbarContextValue = useMemo(
    () => ({fullscreenSearchPortalEl, onSearchOpenChange: handleSearchOpenChange}),
    [fullscreenSearchPortalEl, handleSearchOpenChange]
  )

  const Navbar = useNavbarComponent()

  return (
    <Flex data-ui="ToolScreen" direction="column" height="fill" data-testid="studio-layout">
      <NavbarContext.Provider value={navbarContextValue}>
        <Navbar />
      </NavbarContext.Provider>

      {tools.length === 0 && <NoToolsScreen />}

      {tools.length > 0 && !activeTool && activeToolName && (
        <ToolNotFoundScreen toolName={activeToolName} />
      )}

      {toolError && activeTool && (
        <Card flex={1} overflow="auto" padding={4}>
          <Heading as="h1">
            The <code>{activeToolName}</code> tool crashed
          </Heading>
          <Box marginTop={4}>
            <Button onClick={resetToolError} text="Retry" />
          </Box>
          <Card marginTop={4} overflow="auto" padding={3} tone="critical">
            <Code size={1}>{toolError.error.stack}</Code>
          </Card>
          <Card marginTop={4} overflow="auto" padding={3} tone="critical">
            <Code size={1}>{toolError.info.componentStack}</Code>
          </Card>
        </Card>
      )}

      {searchOpen && (
        <SearchFullscreenPortalCard ref={setFullscreenSearchPortalEl} overflow="auto" />
      )}

      <Card flex={1} hidden={searchOpen}>
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
