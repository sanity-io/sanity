import {MenuIcon} from '@sanity/icons'
import {
  BoundaryElementProvider,
  Box,
  Card,
  Flex,
  Layer,
  LayerProvider,
  PortalProvider,
  useMediaIndex,
  useRootTheme,
  Text,
} from '@sanity/ui'
import React, {useCallback, useState, useMemo, useEffect, useRef, useContext} from 'react'
import {startCase} from 'lodash'
import styled from 'styled-components'
import {isDev} from '../../../environment'
import {useWorkspace} from '../../workspace'
import {Button} from '../../../../ui'
import {useColorScheme} from '../../colorScheme'
import {useWorkspaces} from '../../workspaces'
import {NavbarContext} from '../../StudioLayout'
import {useToolMenuComponent} from '../../studio-components-hooks'
import {StudioTheme} from '../../../theme'
import {useActiveWorkspace} from '../../activeWorkspaceMatcher'
import {UserMenu} from './userMenu'
import {NewDocumentButton, useNewDocumentOptions} from './new-document'
import {PresenceMenu} from './presence'
import {NavDrawer} from './NavDrawer'
import {WorkspaceMenuButton} from './workspace'
import {ConfigIssuesButton} from './configIssues/ConfigIssuesButton'
import {LogoButton} from './LogoButton'
import {SearchButton, SearchDialog} from './search'
import {SearchProvider} from './search/contexts/search/SearchProvider'
import {ResourcesButton} from './resources/ResourcesButton'
import {SanityLogo} from './SanityLogo'
import {SearchPopover} from './search/components/SearchPopover'
import {RouterState, useRouterState, useStateLink} from 'sanity/router'

const LOGO_MARK_SIZE = 33 // width and height, px

const RootLayer = styled(Layer)`
  min-height: auto;
  position: relative;

  &[data-search-open='true'] {
    top: 0;
    position: sticky;
  }
`

const RootCard = styled(Card)`
  line-height: 0;
`

const LogoMarkContainer = styled(Card).attrs({
  overflow: 'hidden',
  radius: 2,
})`
  height: ${LOGO_MARK_SIZE}px;
  width: ${LOGO_MARK_SIZE}px;
`

/**
 * @hidden
 * @beta */
export function StudioNavbar() {
  const {name, tools, ...workspace} = useWorkspace()
  const theme = useRootTheme().theme as StudioTheme
  const workspaces = useWorkspaces()
  const routerState = useRouterState()
  const {scheme} = useColorScheme()
  const {href: rootHref, onClick: handleRootClick} = useStateLink({state: {}})
  const mediaIndex = useMediaIndex()
  const activeToolName = typeof routerState.tool === 'string' ? routerState.tool : undefined

  const newDocumentOptions = useNewDocumentOptions()

  const {
    onSearchFullscreenOpenChange,
    onSearchOpenChange,
    searchFullscreenOpen,
    searchFullscreenPortalEl,
    searchOpen,
  } = useContext(NavbarContext)

  const ToolMenu = useToolMenuComponent()

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

  const routerStateRef = useRef<RouterState>(routerState)
  const workspaceNameRef = useRef<string>(name)

  // Close the NavDrawer when changing tool or workspace
  useEffect(() => {
    if (routerStateRef.current.tool !== routerState.tool || name !== workspaceNameRef.current) {
      setDrawerOpen(false)
    }

    routerStateRef.current = routerState
    workspaceNameRef.current = name
  }, [name, routerState])

  const [drawerButtonEl, setDrawerButtonEl] = useState<HTMLButtonElement | null>(null)
  const [searchOpenButtonEl, setSearchOpenButtonEl] = useState<HTMLButtonElement | null>(null)

  const {activeWorkspace} = useActiveWorkspace()

  const shouldRender = useMemo(
    () => ({
      resources: mediaIndex > 1,
      collapsedPresenceMenu: mediaIndex <= 1,
      loginStatus: mediaIndex > 1,
      searchFullscreen: mediaIndex <= 1,
      configIssues: mediaIndex > 1 && isDev,
      newDocumentFullscreen: mediaIndex <= 1,
      workspaces: mediaIndex >= 3 && workspaces.length > 1,
      tools: mediaIndex >= 3,
    }),
    [mediaIndex, workspaces.length],
  )
  const formattedName = typeof name === 'string' && name !== 'root' ? startCase(name) : null
  const title = workspace.title || formattedName || 'Studio'

  useEffect(() => {
    onSearchFullscreenOpenChange(searchFullscreenOpen)
  }, [searchFullscreenOpen, onSearchFullscreenOpenChange])

  // Disable fullscreen search on media query change (if already open)
  useEffect(() => {
    if (onSearchFullscreenOpenChange && !shouldRender.searchFullscreen) {
      onSearchFullscreenOpenChange(false)
    }
  }, [onSearchFullscreenOpenChange, shouldRender.searchFullscreen])

  const handleOpenSearch = useCallback(() => {
    onSearchOpenChange(true)
  }, [onSearchOpenChange])

  const handleOpenSearchFullscreen = useCallback(() => {
    onSearchFullscreenOpenChange(true)
  }, [onSearchFullscreenOpenChange])

  const handleCloseSearch = useCallback(() => {
    onSearchOpenChange(false)
  }, [onSearchOpenChange])

  const handleCloseSearchFullscreen = useCallback(() => {
    onSearchFullscreenOpenChange(false)
    searchOpenButtonEl?.focus()
  }, [onSearchFullscreenOpenChange, searchOpenButtonEl])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    drawerButtonEl?.focus()
  }, [drawerButtonEl])

  const handleOpenDrawer = useCallback(() => {
    setDrawerOpen(true)
  }, [])

  return (
    <RootLayer zOffset={100} data-search-open={searchFullscreenOpen}>
      <RootCard borderBottom data-testid="navbar" data-ui="Navbar" padding={2} sizing="border">
        {/** Left flex */}
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Flex align="center" gap={1}>
              {/* Menu button */}
              {!shouldRender.tools && (
                <Button
                  mode="bleed"
                  icon={MenuIcon}
                  onClick={handleOpenDrawer}
                  ref={setDrawerButtonEl}
                />
              )}

              {/* Logo mark */}
              <LogoButton href={rootHref} onClick={handleRootClick} title={title}>
                <Flex align="center">
                  <LogoMarkContainer>
                    <Flex align="center" height="fill" justify="center">
                      <SanityLogo />
                    </Flex>
                  </LogoMarkContainer>
                  <Box paddingX={2}>
                    <Text size={1} weight="medium">
                      {activeWorkspace.title}
                    </Text>
                  </Box>
                </Flex>
              </LogoButton>

              {/* Workspace menu button */}
              {shouldRender.workspaces && <WorkspaceMenuButton collapsed />}
            </Flex>

            {/* New document button */}
            <NewDocumentButton
              {...newDocumentOptions}
              modal={shouldRender.newDocumentFullscreen ? 'dialog' : 'popover'}
            />
          </Flex>

          {/** Center flex */}
          <Flex align="center">
            {shouldRender.tools && (
              <ToolMenu
                activeToolName={activeToolName}
                closeSidebar={handleCloseDrawer}
                context="topbar"
                isSidebarOpen={false}
                tools={tools}
              />
            )}
          </Flex>

          {/** Right flex */}
          <Flex align="center" gap={3} style={{flexShrink: 0}}>
            {/* Search */}
            <LayerProvider>
              <SearchProvider fullscreen={shouldRender.searchFullscreen}>
                <BoundaryElementProvider element={document.body}>
                  <PortalProvider element={searchFullscreenPortalEl}>
                    {shouldRender.searchFullscreen && (
                      <SearchDialog
                        onClose={handleCloseSearchFullscreen}
                        onOpen={handleOpenSearchFullscreen}
                        open={searchFullscreenOpen}
                      />
                    )}
                  </PortalProvider>
                  <SearchPopover
                    onClose={handleCloseSearch}
                    onOpen={handleOpenSearch}
                    open={searchOpen}
                  />
                </BoundaryElementProvider>
              </SearchProvider>
            </LayerProvider>

            {/* Search button (desktop) */}
            {!shouldRender.searchFullscreen && (
              <SearchButton onClick={handleOpenSearch} ref={setSearchOpenButtonEl} />
            )}

            {shouldRender.configIssues && <ConfigIssuesButton />}
            {shouldRender.resources && <ResourcesButton />}
            <PresenceMenu />
            {shouldRender.tools && <UserMenu />}
            {/* Search button (mobile) */}
            {shouldRender.searchFullscreen && (
              <SearchButton onClick={handleOpenSearchFullscreen} ref={setSearchOpenButtonEl} />
            )}
          </Flex>
        </Flex>
      </RootCard>

      {!shouldRender.tools && (
        <NavDrawer
          activeToolName={activeToolName}
          isOpen={drawerOpen}
          onClose={handleCloseDrawer}
          tools={tools}
        />
      )}
    </RootLayer>
  )
}
