import {MenuIcon, SearchIcon} from '@sanity/icons'
import {
  BoundaryElementProvider,
  Box,
  Button,
  Card,
  Flex,
  Layer,
  LayerProvider,
  PortalProvider,
  Text,
  Tooltip,
  useMediaIndex,
  useRootTheme,
} from '@sanity/ui'
import React, {useCallback, useState, useMemo, useEffect, useRef, useContext} from 'react'
import {startCase} from 'lodash'
import styled from 'styled-components'
import {isDev} from '../../../environment'
import {useWorkspace} from '../../workspace'
import {useColorScheme} from '../../colorScheme'
import {useWorkspaces} from '../../workspaces'
import {NavbarContext} from '../../StudioLayout'
import {useLogoComponent, useToolMenuComponent} from '../../studio-components-hooks'
import {StudioTheme} from '../../../theme'
import {UserMenu} from './userMenu'
import {NewDocumentButton, useNewDocumentOptions} from './new-document'
import {PresenceMenu} from './presence'
import {NavDrawer} from './NavDrawer'
import {ChangelogButton} from './changelog'
import {WorkspaceMenuButton} from './workspace'
import {ConfigIssuesButton} from './configIssues/ConfigIssuesButton'
import {LogoButton} from './LogoButton'
import {SearchDialog, SearchField} from './search'
import {SearchProvider} from './search/contexts/search/SearchProvider'
import {RouterState, useRouterState, useStateLink} from 'sanity/router'

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

const LeftFlex = styled(Flex)`
  width: max-content;
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

  const {onSearchFullscreenOpenChange, searchFullscreenOpen, searchFullscreenPortalEl} =
    useContext(NavbarContext)

  const Logo = useLogoComponent()
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

  const shouldRender = useMemo(
    () => ({
      brandingCenter: mediaIndex <= 1,
      changelog: mediaIndex > 1,
      collapsedPresenceMenu: mediaIndex <= 1,
      loginStatus: mediaIndex > 1,
      searchFullscreen: mediaIndex <= 1,
      configIssues: mediaIndex > 1 && isDev,
      workspaces: mediaIndex >= 3 && workspaces.length > 1,
      tools: mediaIndex >= 3,
    }),
    [mediaIndex, workspaces.length]
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

  const handleOpenSearchFullscreen = useCallback(() => {
    onSearchFullscreenOpenChange(true)
  }, [onSearchFullscreenOpenChange])

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
      <RootCard
        data-testid="navbar"
        data-ui="Navbar"
        padding={2}
        scheme="dark"
        shadow={theme.__legacy || scheme === 'dark' ? 1 : undefined}
        sizing="border"
      >
        <Flex align="center" justify="space-between">
          <LeftFlex align="center" flex={shouldRender.brandingCenter ? undefined : 1}>
            {!shouldRender.tools && (
              <Box marginRight={1}>
                <Button
                  mode="bleed"
                  icon={MenuIcon}
                  onClick={handleOpenDrawer}
                  ref={setDrawerButtonEl}
                />
              </Box>
            )}

            {!shouldRender.brandingCenter && (
              <Box marginRight={1}>
                <LogoButton href={rootHref} onClick={handleRootClick} title={title}>
                  <Logo title={title} />
                </LogoButton>
              </Box>
            )}

            {shouldRender.workspaces && (
              <Box marginRight={2}>
                <Tooltip
                  content={
                    <Box padding={2}>
                      <Text size={1}>Select workspace</Text>
                    </Box>
                  }
                  placement="bottom"
                  portal
                  scheme={scheme}
                >
                  <Box>
                    <WorkspaceMenuButton />
                  </Box>
                </Tooltip>
              </Box>
            )}

            <Box marginRight={shouldRender.brandingCenter ? undefined : 2}>
              <NewDocumentButton
                {...newDocumentOptions}
                modal={shouldRender.brandingCenter ? 'dialog' : 'popover'}
              />
            </Box>

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
                  {!shouldRender.searchFullscreen && <SearchField />}
                </BoundaryElementProvider>
              </SearchProvider>
            </LayerProvider>

            {shouldRender.tools && (
              <Card borderRight flex={1} marginX={2} overflow="visible" paddingRight={1}>
                <ToolMenu
                  activeToolName={activeToolName}
                  closeSidebar={handleCloseDrawer}
                  context="topbar"
                  isSidebarOpen={false}
                  tools={tools}
                />
              </Card>
            )}
          </LeftFlex>

          {shouldRender.brandingCenter && (
            <Box marginX={1}>
              <LogoButton href={rootHref} onClick={handleRootClick} title={title}>
                <Logo title={title} />
              </LogoButton>
            </Box>
          )}

          <Flex align="center">
            <Box marginRight={1}>
              <PresenceMenu collapse={shouldRender.collapsedPresenceMenu} />
            </Box>

            {shouldRender.changelog && (
              <Box marginRight={1}>
                <ChangelogButton />
              </Box>
            )}

            {shouldRender.configIssues && (
              <Box marginRight={2}>
                <ConfigIssuesButton />
              </Box>
            )}

            {shouldRender.tools && (
              <Box>
                <UserMenu />
              </Box>
            )}

            {shouldRender.searchFullscreen && (
              <Button
                aria-label="Open search"
                icon={SearchIcon}
                mode="bleed"
                onClick={handleOpenSearchFullscreen}
                ref={setSearchOpenButtonEl}
              />
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
