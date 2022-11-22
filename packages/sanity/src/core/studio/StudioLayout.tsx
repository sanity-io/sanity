import {Card, Flex, Spinner} from '@sanity/ui'
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

function LoadingTool() {
  return (
    <Flex align="center" height="fill" justify="center">
      <Spinner muted />
    </Flex>
  )
}
