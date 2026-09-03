import {MenuIcon} from '@sanity/icons/Menu'
import {
  BoundaryElementProvider,
  Card,
  Grid,
  Layer,
  LayerProvider,
  PortalProvider,
  useMediaIndex,
} from '@sanity/ui'
import {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {NavbarContext} from 'sanity/_singletons'
import {type RouterState, useRouterState} from 'sanity/router'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {TooltipDelayGroupProvider} from '../../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {CapabilityGate} from '../../../components/CapabilityGate'
import {type NavbarProps} from '../../../config/studio/types'
import {isDev} from '../../../environment'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {ReleasesNav} from '../../../perspective/navbar/ReleasesNav'
import {usePerspective} from '../../../perspective/usePerspective'
import {getReleaseTone} from '../../../releases/util/getReleaseTone'
import {useToolMenuComponent} from '../../studio-components-hooks/useToolMenuComponent'
import {useWorkspace} from '../../workspace'
import {ConfigIssuesButton} from './configIssues/ConfigIssuesButton'
import {FreeTrial} from './free-trial/FreeTrial'
import {FreeTrialProvider} from './free-trial/FreeTrialProvider'
import {HomeButton} from './home/HomeButton'
import {NavDrawer} from './navDrawer/NavDrawer'
import {NewDocumentButton} from './new-document/NewDocumentButton'
import {useNewDocumentOptions} from './new-document/useNewDocumentOptions'
import {PresenceMenu} from './presence/PresenceMenu'
import {ResourcesButton} from './resources/ResourcesButton'
import {SearchPopover} from './search/components/SearchPopover'
import {SearchProvider} from './search/contexts/search/SearchProvider'
import {SearchButton} from './search/SearchButton'
import {SearchDialog} from './search/SearchDialog'
import {navGrid, rootCard, rootLayer} from './StudioNavbar.css'
import {UserMenu} from './userMenu/UserMenu'
import {WorkspaceMenuButton} from './workspace/WorkspaceMenuButton'

const EMPTY_ARRAY: [] = []

const CENTER_TOOLS_STYLE = {minWidth: 0, overflow: 'hidden'} as const

/**
 * @hidden
 * @beta */
export function StudioNavbar(props: Omit<NavbarProps, 'renderDefault'>) {
  const {__internal_actions: actions = EMPTY_ARRAY} = props

  const {beta, name, tools} = useWorkspace()
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

  const {selectedPerspective, perspectiveStack, selectedVariantName} = usePerspective()

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

  const actionNodes = useMemo(() => {
    if (!shouldRender.tools) return null

    return actions
      ?.filter((v) => v.location === 'topbar')
      ?.map((action) => {
        const {render: ActionComponent} = action

        if (ActionComponent) return <ActionComponent key={action.name} />

        return (
          <Button
            key={action.name}
            iconRight={action?.icon}
            mode="bleed"
            onClick={action?.onAction}
            selected={action.selected}
            text={action.title}
          />
        )
      })
  }, [actions, shouldRender.tools])

  return (
    <FreeTrialProvider>
      <Layer className={rootLayer} zOffset={100} data-search-open={searchFullscreenOpen}>
        <Card
          className={rootCard}
          tone={getReleaseTone(selectedPerspective)}
          borderBottom
          data-testid="studio-navbar"
          data-ui="Navbar"
          padding={3}
          sizing="border"
        >
          <Grid className={navGrid} gap={1}>
            {/** Left flex */}
            <TooltipDelayGroupProvider>
              <Flex alignItems="center" gap={2} justifyContent="flex-start">
                <Flex alignItems="center" gap={2}>
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
            <Flex alignItems="center" justifyContent="center" style={CENTER_TOOLS_STYLE}>
              {shouldRender.tools && (
                // oxlint-disable-next-line react/static-components -- this is intentional and how the middleware components has to work
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
              <Flex alignItems="center" gap={1} justifyContent="flex-end">
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
                            previewPerspective={perspectiveStack}
                            previewVariant={selectedVariantName}
                          />
                        </PortalProvider>
                      ) : (
                        <SearchPopover
                          onClose={handleCloseSearch}
                          onOpen={handleOpenSearch}
                          open={searchOpen}
                          previewPerspective={perspectiveStack}
                          previewVariant={selectedVariantName}
                        />
                      )}
                    </BoundaryElementProvider>
                  </SearchProvider>
                </LayerProvider>

                {!beta?.variants?.enabled && <ReleasesNav withReleasesToolButton />}
                {actionNodes}
                {shouldRender.tools && <FreeTrial type="topbar" />}
                <PresenceMenu />
                {shouldRender.configIssues && <ConfigIssuesButton />}
                {shouldRender.resources && <ResourcesButton />}

                {/* Search button (mobile) */}
                {shouldRender.searchFullscreen && (
                  <SearchButton onClick={handleOpenSearchFullscreen} ref={setSearchOpenButtonEl} />
                )}

                {shouldRender.tools && (
                  <CapabilityGate capability="globalUserMenu">
                    <Box flexBasis="auto" flexGrow={0} flexShrink={0} marginLeft={1}>
                      <UserMenu />
                    </Box>
                  </CapabilityGate>
                )}
              </Flex>
            </TooltipDelayGroupProvider>
          </Grid>
        </Card>

        {!shouldRender.tools && (
          <NavDrawer
            __internal_actions={actions}
            activeToolName={activeToolName}
            isOpen={drawerOpen}
            onClose={handleCloseDrawer}
            tools={tools}
          />
        )}
      </Layer>
    </FreeTrialProvider>
  )
}
