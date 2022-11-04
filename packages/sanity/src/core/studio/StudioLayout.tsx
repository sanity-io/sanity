import {Box, Button, Card, Code, ErrorBoundary, Flex, Heading, Spinner, Stack} from '@sanity/ui'
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
  height: 100%;
  left: 0;
  overflow: hidden;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 200;
`

/** @internal */
export interface NavbarContextValue {
  onSearchFullscreenOpenChange: (open: boolean) => void
  searchFullscreenOpen: boolean
  searchFullscreenPortalEl: HTMLElement | null
}

/** @internal */
export const NavbarContext = createContext<NavbarContextValue>({
  onSearchFullscreenOpenChange: () => '',
  searchFullscreenOpen: false,
  searchFullscreenPortalEl: null,
})

/** @public */
export function StudioLayout() {
  const {state: routerState} = useRouter()
  const {name, title, tools} = useWorkspace()
  const activeToolName = typeof routerState.tool === 'string' ? routerState.tool : undefined
  const activeTool = tools.find((tool) => tool.name === activeToolName)
  const [searchFullscreenOpen, setSearchFullscreenOpen] = useState<boolean>(false)
  const [searchFullscreenPortalEl, setSearchFullscreenPortalEl] = useState<HTMLDivElement | null>(
    null
  )
  const [toolError, setToolError] = useState<{error: Error; info: React.ErrorInfo} | null>(null)

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

  const handleSearchFullscreenOpenChange = useCallback((open: boolean) => {
    setSearchFullscreenOpen(open)
  }, [])

  const resetToolError = useCallback(() => setToolError(null), [setToolError])

  useEffect(resetToolError, [activeToolName, resetToolError])
  useHotModuleReload(resetToolError)

  const navbarContextValue = useMemo(
    () => ({
      searchFullscreenOpen,
      searchFullscreenPortalEl,
      onSearchFullscreenOpenChange: handleSearchFullscreenOpenChange,
    }),
    [searchFullscreenOpen, searchFullscreenPortalEl, handleSearchFullscreenOpenChange]
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
        <Card flex={1} overflow="auto" padding={4} sizing="border">
          <Stack space={4}>
            <Heading as="h1">
              The <code>{activeToolName}</code> tool crashed
            </Heading>
            <Box>
              <Button onClick={resetToolError} text="Retry" />
            </Box>

            <Card overflow="auto" padding={3} tone="critical" radius={2}>
              <Code size={1}>{toolError.error.stack}</Code>
            </Card>

            <Card overflow="auto" padding={3} tone="critical" radius={2}>
              <Code size={1}>{toolError.info.componentStack}</Code>
            </Card>
          </Stack>
        </Card>
      )}

      {searchFullscreenOpen && (
        <SearchFullscreenPortalCard ref={setSearchFullscreenPortalEl} overflow="auto" />
      )}

      {!toolError && (
        <Card flex={1} hidden={searchFullscreenOpen}>
          {activeTool && activeToolName && (
            <RouteScope scope={activeToolName}>
              <ErrorBoundary onCatch={setToolError}>
                <Suspense fallback={<LoadingTool />}>
                  {createElement(activeTool.component, {tool: activeTool})}
                </Suspense>
              </ErrorBoundary>
            </RouteScope>
          )}
        </Card>
      )}
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
