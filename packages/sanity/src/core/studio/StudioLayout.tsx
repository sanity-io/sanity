import {Card, Flex, Spinner, Text} from '@sanity/ui'
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
import {NoToolsScreen} from './screens/NoToolsScreen'
import {ToolNotFoundScreen} from './screens/ToolNotFoundScreen'
import {useNavbarComponent} from './studio-components-hooks'
import {StudioErrorBoundary} from './StudioErrorBoundary'
import {useWorkspace} from './workspace'
import {RouteScope, useRouterState} from 'sanity/router'

const SearchFullscreenPortalCard = styled(Card)`
  height: 100%;
  left: 0;
  overflow: hidden;
  overflow: clip;
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

/**
 * The Studio Layout component is the root component of the Sanity Studio UI.
 * It renders the navbar, the active tool, and the search modal as well as the error boundary.
 *
 * @public
 * @returns A Studio Layout element that renders the navbar, the active tool, and the search modal as well as the error boundary
 * @remarks This component should be used as a child component to the StudioProvider
 * @example Rendering a Studio Layout
 * ```ts
 * <StudioProvider
 *  basePath={basePath}
 *  config={config}
 *  onSchemeChange={onSchemeChange}
 *  scheme={scheme}
 *  unstable_history={unstable_history}
 *  unstable_noAuthBoundary={unstable_noAuthBoundary}
 * >
 *   <StudioLayout />
 *</StudioProvider>
 * ```
 */
export function StudioLayout() {
  const {name, title, tools} = useWorkspace()
  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )
  const activeTool = useMemo(
    () => tools.find((tool) => tool.name === activeToolName),
    [activeToolName, tools],
  )
  const [searchFullscreenOpen, setSearchFullscreenOpen] = useState<boolean>(false)
  const [searchFullscreenPortalEl, setSearchFullscreenPortalEl] = useState<HTMLDivElement | null>(
    null,
  )

  const documentTitle = useMemo(() => {
    const mainTitle = title || startCase(name)

    if (activeToolName) {
      return `${startCase(activeToolName)} | ${mainTitle}`
    }

    return mainTitle
  }, [activeToolName, name, title])

  useEffect(() => {
    if (activeToolName === 'content') {
      // Will be handled by sanity/src/desk/components/deskTool/DeskTitle.tsx
      return
    }
    document.title = documentTitle
  }, [documentTitle, activeToolName])

  const handleSearchFullscreenOpenChange = useCallback((open: boolean) => {
    setSearchFullscreenOpen(open)
  }, [])

  const navbarContextValue = useMemo(
    () => ({
      searchFullscreenOpen,
      searchFullscreenPortalEl,
      onSearchFullscreenOpenChange: handleSearchFullscreenOpenChange,
    }),
    [searchFullscreenOpen, searchFullscreenPortalEl, handleSearchFullscreenOpenChange],
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
      {searchFullscreenOpen && (
        <SearchFullscreenPortalCard ref={setSearchFullscreenPortalEl} overflow="auto" />
      )}
      {/* By using the tool name as the key on the error boundary, we force it to re-render
          when switching tools, which ensures we don't show the wrong tool having crashed */}
      <StudioErrorBoundary key={activeTool?.name} heading={`The ${activeTool?.name} tool crashed`}>
        <Card flex={1} hidden={searchFullscreenOpen}>
          {activeTool && activeToolName && (
            <RouteScope scope={activeToolName}>
              <Suspense fallback={<LoadingTool />}>
                {createElement(activeTool.component, {tool: activeTool})}
              </Suspense>
            </RouteScope>
          )}
        </Card>
      </StudioErrorBoundary>
    </Flex>
  )
}

// @TODO re-use `LoadingComponent`, which is `LoadingScreen` by default, to reduce "popping" during initial load
function LoadingTool() {
  return (
    <Flex justify="center" align="center" height="fill" direction="column" gap={4}>
      <Text muted>Loading…</Text>
      <Spinner muted />
    </Flex>
  )
}
