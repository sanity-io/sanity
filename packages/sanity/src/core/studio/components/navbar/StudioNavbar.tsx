import {MenuIcon} from '@sanity/icons'
import {
  BoundaryElementProvider,
  Box,
  Card,
  Flex,
  Grid,
  Layer,
  LayerProvider,
  PortalProvider,
  useMediaIndex,
} from '@sanity/ui'
import {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {type RouterState, useRouterState} from 'sanity/router'
import styled from 'styled-components'

import {Button, TooltipDelayGroupProvider} from '../../../../ui-components'
import {type NavbarProps} from '../../../config/studio/types'
import {isDev} from '../../../environment'
import {useTranslation} from '../../../i18n'
import {useToolMenuComponent} from '../../studio-components-hooks'
import {NavbarContext} from '../../StudioLayout'
import {useWorkspace} from '../../workspace'
import {ConfigIssuesButton} from './configIssues/ConfigIssuesButton'
import {FreeTrial} from './free-trial'
import {FreeTrialProvider} from './free-trial/FreeTrialProvider'
import {HomeButton} from './home/HomeButton'
import {NavDrawer} from './navDrawer'
import {NewDocumentButton, useNewDocumentOptions} from './new-document'
import {PresenceMenu} from './presence'
import {ResourcesButton} from './resources/ResourcesButton'
import {SearchButton, SearchDialog} from './search'
import {SearchPopover} from './search/components/SearchPopover'
import {SearchProvider} from './search/contexts/search/SearchProvider'
import {UserMenu} from './userMenu'
import {WorkspaceMenuButton} from './workspace'

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

const NavGrid = styled(Grid)`
  grid-template-columns: auto auto auto;
  @media screen and (min-width: ${({theme}) => `${theme.sanity.media[3]}px`}) {
    grid-template-columns: 1fr auto 1fr;
  }
`

/**
 * @hidden
 * @beta */
export function StudioNavbar(props: Omit<NavbarProps, 'renderDefault'>) {
  // eslint-disable-next-line camelcase
  const {__internal_rightSectionNode = null} = props
  const {name, tools} = useWorkspace()
  const routerState = useRouterState()
  const mediaIndex = useMediaIndex()
  const activeToolName = typeof routerState.tool === 'string' ? routerState.tool : undefined

  const newDocumentOptions = useNewDocumentOptions()
  const {t} = useTranslation()

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

  const shouldRender = useMemo(
    () => ({
      resources: mediaIndex > 1,
      collapsedPresenceMenu: mediaIndex <= 1,
      loginStatus: mediaIndex > 1,
      searchFullscreen: mediaIndex <= 1,
      configIssues: mediaIndex > 1 && isDev,
      newDocumentFullscreen: mediaIndex <= 1,
      tools: mediaIndex >= 3,
    }),
    [mediaIndex],
  )

  useEffect(() => {
    onSearchFullscreenOpenChange(searchFullscreenOpen)
  }, [searchFullscreenOpen, onSearchFullscreenOpenChange])

  // On desktop: force search dialog to be hidden
  // On mobile: force search popover to be hidden
  // This is a bit of a micro optimisation to prevent search surfaces from remaining open
  // when jumping between both mobile / desktop breakpoints.
  useEffect(() => {
    if (shouldRender.searchFullscreen) {
      onSearchOpenChange(false)
    } else {
      onSearchFullscreenOpenChange(false)
    }
  }, [onSearchFullscreenOpenChange, onSearchOpenChange, shouldRender.searchFullscreen])

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
    <FreeTrialProvider>
      <RootLayer zOffset={100} data-search-open={searchFullscreenOpen}>
        <RootCard
          borderBottom
          data-testid="studio-navbar"
          data-ui="Navbar"
          padding={3}
          sizing="border"
        >
          <NavGrid gap={1}>
            {/** Left flex */}
            <TooltipDelayGroupProvider>
              <Flex align="center" gap={2} justify="flex-start">
                <Flex align="center" gap={2}>
                  {/* Menu button */}
                  {!shouldRender.tools && (
                    <Button
                      mode="bleed"
                      icon={MenuIcon}
                      onClick={handleOpenDrawer}
                      ref={setDrawerButtonEl}
                      tooltipProps={{content: t('user-menu.open-menu'), placement: 'bottom'}}
                    />
                  )}

                  {/* Home + workspace menu buttons */}
                  <Flex gap={1}>
                    <HomeButton />
                    <WorkspaceMenuButton />
                  </Flex>
                </Flex>
                {/* New document button */}
                <NewDocumentButton
                  {...newDocumentOptions}
                  modal={shouldRender.newDocumentFullscreen ? 'dialog' : 'popover'}
                />
                {/* Search button (desktop) */}
                {!shouldRender.searchFullscreen && (
                  <SearchButton onClick={handleOpenSearch} ref={setSearchOpenButtonEl} />
                )}
              </Flex>
            </TooltipDelayGroupProvider>

            {/** Center flex */}
            <Flex align="center" justify="center">
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
            <TooltipDelayGroupProvider>
              <Flex align="center" gap={1} justify="flex-end">
                <Flex gap={1}>
                  {/* Search */}
                  <LayerProvider>
                    <SearchProvider fullscreen={shouldRender.searchFullscreen}>
                      <BoundaryElementProvider element={document.body}>
                        {shouldRender.searchFullscreen ? (
                          <PortalProvider element={searchFullscreenPortalEl}>
                            <SearchDialog
                              onClose={handleCloseSearchFullscreen}
                              onOpen={handleOpenSearchFullscreen}
                              open={searchFullscreenOpen}
                            />
                          </PortalProvider>
                        ) : (
                          <SearchPopover
                            onClose={handleCloseSearch}
                            onOpen={handleOpenSearch}
                            open={searchOpen}
                          />
                        )}
                      </BoundaryElementProvider>
                    </SearchProvider>
                  </LayerProvider>
                  {shouldRender.tools && <FreeTrial type="topbar" />}
                  {shouldRender.configIssues && <ConfigIssuesButton />}
                  {shouldRender.resources && <ResourcesButton />}
                  <PresenceMenu />
                  {/* Search button (mobile) */}
                  {shouldRender.searchFullscreen && (
                    <SearchButton
                      onClick={handleOpenSearchFullscreen}
                      ref={setSearchOpenButtonEl}
                    />
                  )}

                  {
                    // eslint-disable-next-line camelcase
                    __internal_rightSectionNode
                  }
                </Flex>
                {shouldRender.tools && (
                  <Box flex="none" marginLeft={1}>
                    <UserMenu />
                  </Box>
                )}
              </Flex>
            </TooltipDelayGroupProvider>
          </NavGrid>
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
    </FreeTrialProvider>
  )
}
