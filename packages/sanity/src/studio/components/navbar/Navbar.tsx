import {CloseIcon, MenuIcon, SearchIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Flex,
  Layer,
  Text,
  Tooltip,
  useGlobalKeyDown,
  useMediaIndex,
} from '@sanity/ui'
import React, {
  createElement,
  useCallback,
  useState,
  isValidElement,
  useMemo,
  useEffect,
  useRef,
} from 'react'
import {isValidElementType} from 'react-is'
import {startCase} from 'lodash'
import styled from 'styled-components'
import {useWorkspace} from '../../workspace'
import {useColorScheme} from '../../colorScheme'
import {RouterState, useRouterState, useStateLink} from '../../../router'
import {useWorkspaces} from '../../workspaces'
import {isDev} from '../../../environment'
import {UserMenu} from './userMenu'
import {NewDocumentButton} from './NewDocumentButton'
import {PresenceMenu} from './presence'
import {NavDrawer} from './NavDrawer'
import {SearchField} from './search'
import {ToolMenu as DefaultToolMenu} from './tools/ToolMenu'
import {ChangelogButton} from './changelog'
import {WorkspaceMenuButton} from './workspace'
import {ConfigIssuesButton} from './configIssues/ConfigIssuesButton'

const RootLayer = styled(Layer)`
  min-height: auto;
  position: relative;

  &[data-search-open='true'] {
    top: 0;
    position: sticky;
  }
`

const SearchCard = styled(Card)`
  z-index: 1;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;

  &[data-fullscreen='true'] {
    position: absolute;
  }

  &[data-fullscreen='false'] {
    min-width: 253px;
    max-width: 350px;
  }
`

const LeftFlex = styled(Flex)`
  width: max-content;
`

interface NavbarProps {
  onSearchOpenChange: (open: boolean) => void
  fullscreenSearchPortalEl: HTMLElement | null
}

export function Navbar(props: NavbarProps) {
  const {fullscreenSearchPortalEl, onSearchOpenChange} = props
  const {name, logo, navbar, tools, ...workspace} = useWorkspace()
  const workspaces = useWorkspaces()
  const routerState = useRouterState()
  const ToolMenu = navbar?.components?.ToolMenu || DefaultToolMenu
  const {scheme} = useColorScheme()
  const rootLink = useStateLink({state: {}})
  const mediaIndex = useMediaIndex()
  const activeToolName = typeof routerState.tool === 'string' ? routerState.tool : undefined

  const [searchOpen, setSearchOpen] = useState<boolean>(false)
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
  const [searchInputElement, setSearchInputElement] = useState<HTMLInputElement | null>(null)
  const [searchOpenButtonEl, setSearchOpenButtonEl] = useState<HTMLButtonElement | null>(null)
  const [searchCloseButtonEl, setSearchCloseButtonEl] = useState<HTMLButtonElement | null>(null)

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
    onSearchOpenChange(searchOpen)
    if (searchOpen) searchInputElement?.focus()
  }, [searchOpen, searchInputElement, onSearchOpenChange])

  useGlobalKeyDown((e) => {
    if (e.key === 'Escape' && searchOpen) {
      handleCloseSearch()
    }
  })

  const handleOpenSearch = useCallback(() => {
    setSearchOpen(true)
  }, [])

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false)
    searchOpenButtonEl?.focus()
  }, [searchOpenButtonEl])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    drawerButtonEl?.focus()
  }, [drawerButtonEl])

  const handleOpenDrawer = useCallback(() => {
    setDrawerOpen(true)
  }, [])

  const rootLinkContent = (() => {
    if (isValidElementType(logo)) return createElement(logo)
    if (isValidElement(logo)) return logo
    return <Text weight="bold">{title}</Text>
  })()

  const brandingComponent = useMemo(
    () => (
      <Button
        aria-label={title}
        as="a"
        href={rootLink.href}
        mode="bleed"
        onClick={rootLink.handleClick}
        padding={3}
      >
        {rootLinkContent}
      </Button>
    ),
    [rootLink.handleClick, rootLink.href, rootLinkContent, title]
  )

  // The HTML elements that are part of the search view (i.e. the "close" button that is visible
  // when in fullscreen mode on narrow devices) needs to be passed to `<Autocomplete />` so it knows
  // how to make the search experience work properly for non-sighted users.
  // Specifically – without passing `relatedElements`, the listbox with results will close when you
  // TAB to focus the "close" button, and that‘s not a good experience for anyone.
  const searchRelatedElements = useMemo(
    () => [searchCloseButtonEl].filter(Boolean) as HTMLElement[],
    [searchCloseButtonEl]
  )

  return (
    <RootLayer zOffset={100} data-search-open={searchOpen}>
      <Card
        scheme="dark"
        shadow={scheme === 'dark' ? 1 : undefined}
        style={{lineHeight: 0}}
        padding={2}
        sizing="border"
        data-ui="Navbar"
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

            {!shouldRender.brandingCenter && <Box marginRight={1}>{brandingComponent}</Box>}

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
              <NewDocumentButton />
            </Box>

            {(searchOpen || !shouldRender.searchFullscreen) && (
              <SearchCard
                data-fullscreen={shouldRender.searchFullscreen}
                data-ui="SearchRoot"
                flex={1}
                padding={shouldRender.searchFullscreen ? 2 : undefined}
                scheme={shouldRender.searchFullscreen ? 'light' : undefined}
                shadow={shouldRender.searchFullscreen ? 1 : undefined}
              >
                <Flex>
                  <Box flex={1} marginRight={shouldRender.tools ? undefined : [1, 1, 2]}>
                    <SearchField
                      fullScreen={shouldRender.searchFullscreen}
                      onSearchItemClick={handleCloseSearch}
                      portalElement={fullscreenSearchPortalEl}
                      setSearchInputElement={setSearchInputElement}
                      relatedElements={searchRelatedElements}
                    />
                  </Box>

                  {shouldRender.searchFullscreen && (
                    <Button
                      aria-label="Close search"
                      icon={CloseIcon}
                      mode="bleed"
                      onClick={handleCloseSearch}
                      ref={setSearchCloseButtonEl}
                    />
                  )}
                </Flex>
              </SearchCard>
            )}

            {shouldRender.tools && (
              <Card borderRight flex={1} marginX={2} overflow="visible" paddingRight={1}>
                <ToolMenu
                  activeToolName={activeToolName}
                  context="topbar"
                  isDrawerOpen={false}
                  tools={tools}
                  closeDrawer={handleCloseDrawer}
                />
              </Card>
            )}
          </LeftFlex>

          {shouldRender.brandingCenter && <Box marginX={1}>{brandingComponent}</Box>}

          <Flex align="center">
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

            <Box marginRight={1}>
              <PresenceMenu collapse={shouldRender.collapsedPresenceMenu} />
            </Box>

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
                onClick={handleOpenSearch}
                ref={setSearchOpenButtonEl}
              />
            )}
          </Flex>
        </Flex>
      </Card>

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
