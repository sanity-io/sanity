// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import classNames from 'classnames'
import React, {createElement, useCallback, useMemo} from 'react'
import config from 'config:sanity'
import {StateLink} from '@sanity/base/router'
import * as sidecar from 'part:@sanity/default-layout/sidecar?'
import {InsufficientPermissionsMessage, LegacyLayerProvider} from '@sanity/base/components'
// eslint-disable-next-line camelcase
import {unstable_useCanCreateAnyOf, useCurrentUser} from '@sanity/base/hooks'
import {Button, Card, Container, Flex, Tooltip, useMediaIndex, Text, Box} from '@sanity/ui'
import styled from 'styled-components'
import {SearchIcon, PlugIcon, MenuIcon, ComposeIcon, PackageIcon} from '@sanity/icons'
import {HAS_SPACES} from '../util/spaces'
import {Router, Tool} from '../types'
import DatasetSelect from '../datasetSelect'
import {CollapseMenu, StatusButton} from './components'
import {PresenceMenu} from './presence'
import Branding from './branding/Branding'
import {LoginStatus} from './loginStatus'
import SanityStatusContainer from './studioStatus/SanityStatusContainer'
import SearchContainer from './search/SearchContainer'

import {SearchField} from './search-2'

import styles from './Navbar.css'

interface Props {
  createMenuIsOpen: boolean
  onCreateButtonClick: () => void
  onSearchClose: () => void
  onSearchOpen: () => void
  onSetLoginStatusElement: (element: HTMLDivElement) => void
  onSetSearchElement: (element: HTMLDivElement) => void
  onSwitchTool: () => void
  onToggleMenu: () => void
  onUserLogout: () => void
  router: Router
  searchIsOpen: boolean
  showLabel: boolean
  showToolMenu: boolean
  tools: Tool[]
  documentTypes: string[]
}

type NavElements =
  | 'sidebar'
  | 'spaces'
  | 'create-document'
  | 'search-field'
  | 'search-button'
  | 'tools'
  | 'hints'
  | 'login-status'
  | 'sanity-status'
  | 'collapsed-presence-menu'
  | 'branding-left'
  | 'branding-center'

const FLEX_GAP = [1, 1, 2, 2]

const Root = styled(Card)`
  position: relative;
  display: flex;
  align-items: center;
  white-space: nowrap;
`

// eslint-disable-next-line complexity
export default function Navbar(props: Props) {
  const {
    createMenuIsOpen,
    onCreateButtonClick,
    onToggleMenu,
    onSwitchTool,
    onUserLogout,
    onSearchOpen,
    onSearchClose,
    onSetLoginStatusElement,
    onSetSearchElement,
    router,
    tools,
    searchIsOpen,
    documentTypes,
    showLabel,
    showToolMenu,
  } = props

  const rootState = HAS_SPACES && router.state.space ? {space: router.state.space} : {}
  const className = classNames(styles.root, showToolMenu && styles.withToolMenu)
  const searchClassName = classNames(styles.search, searchIsOpen && styles.searchIsOpen)
  const tool = router.state?.tool || ''
  const {value: currentUser} = useCurrentUser()
  const createAnyPermission = unstable_useCanCreateAnyOf(documentTypes)

  const mediaIndex = useMediaIndex()

  const shouldRender = useCallback(
    (key: NavElements) => {
      switch (key) {
        case 'sidebar': {
          return mediaIndex < 3
        }
        case 'spaces': {
          return HAS_SPACES && mediaIndex >= 3
        }
        case 'create-document': {
          return true
        }
        case 'search-field': {
          return mediaIndex >= 2 || searchIsOpen
        }
        case 'tools': {
          return mediaIndex >= 3
        }
        case 'search-button': {
          return mediaIndex < 2
        }
        case 'hints': {
          return (
            mediaIndex >= 2 && sidecar && sidecar.isSidecarEnabled && sidecar.isSidecarEnabled()
          )
        }
        case 'login-status': {
          return mediaIndex >= 3
        }
        case 'sanity-status': {
          return mediaIndex > 2
        }
        case 'collapsed-presence-menu': {
          return mediaIndex < 2
        }
        case 'branding-center': {
          return mediaIndex <= 1
        }
        case 'branding-left': {
          return mediaIndex > 1
        }
        default: {
          return true
        }
      }
    },
    [mediaIndex, searchIsOpen]
  )

  const LinkComponent = useCallback(
    (linkProps) => {
      const {name} = linkProps?.tool
      return <StateLink {...linkProps} state={{...router.state, tool: name, [name]: undefined}} />
    },
    [router.state]
  )

  const toolOptions = useMemo(
    () =>
      tools.map((t) => {
        return {
          id: t.name,
          text: t.title,
          icon: t?.icon || PlugIcon,
          mode: 'bleed',
          tone: 'primary',
          tool: t,
          as: LinkComponent,
          selected: tool === t.name,
          'data-as': 'button',
        }
      }),
    [LinkComponent, tool, tools]
  )

  return (
    <Root borderBottom scheme="dark">
      <Container width={5}>
        <Flex
          gap={FLEX_GAP}
          justify="space-between"
          align="center"
          sizing="border"
          paddingX={2}
          paddingY={[2, 2, 2, 1]}
        >
          <Flex
            gap={FLEX_GAP}
            align="center"
            style={{flex: shouldRender('branding-center') ? 'none' : 1}}
          >
            {shouldRender('sidebar') && (
              <Button
                aria-label="Open menu"
                icon={MenuIcon}
                mode="bleed"
                onClick={onToggleMenu}
                title="Open menu"
              />
            )}

            {shouldRender('branding-left') && (
              <StateLink state={rootState} className={styles.brandingLink}>
                <Branding projectName={config && config.project.name} />
              </StateLink>
            )}

            {shouldRender('spaces') && (
              <Box>
                <DatasetSelect isVisible={showToolMenu} tone="navbar" />
              </Box>
            )}

            {shouldRender('create-document') && (
              <Tooltip
                portal
                content={
                  <Box padding={2}>
                    {createAnyPermission.granted ? (
                      <Text size={1} muted>
                        Create new document
                      </Text>
                    ) : (
                      <InsufficientPermissionsMessage
                        currentUser={currentUser}
                        operationLabel="create any document"
                      />
                    )}
                  </Box>
                }
              >
                <Box>
                  <Button
                    aria-label="Create"
                    data-testid="default-layout-global-create-button"
                    icon={ComposeIcon}
                    mode="bleed"
                    onClick={onCreateButtonClick}
                    disabled={!createAnyPermission.granted}
                    selected={createMenuIsOpen}
                  />
                </Box>
              </Tooltip>
            )}

            {shouldRender('search-field') && (
              <LegacyLayerProvider zOffset="navbarPopover">
                <Box flex={1}>
                  <SearchField />
                </Box>
              </LegacyLayerProvider>
            )}
          </Flex>

          {shouldRender('branding-center') && (
            <StateLink state={rootState} className={styles.brandingLink}>
              <Branding projectName={config && config.project.name} />
            </StateLink>
          )}

          <Flex
            gap={FLEX_GAP}
            justify="flex-end"
            align="center"
            style={{flex: shouldRender('tools') ? 1 : 'none'}}
          >
            {shouldRender('tools') && (
              <LegacyLayerProvider zOffset="navbarPopover">
                <Box flex={1}>
                  <Card shadow={1} radius={2}>
                    <CollapseMenu options={toolOptions} />
                  </Card>
                </Box>
              </LegacyLayerProvider>
            )}

            <Flex align="center" gap={1}>
              {shouldRender('sanity-status') && (
                <>
                  <SanityStatusContainer />
                  <StatusButton icon={PackageIcon} mode="bleed" statusTone="primary" />
                </>
              )}

              {shouldRender('hints') && (
                <Box>{sidecar && createElement(sidecar.SidecarToggleButton)}</Box>
              )}

              <LegacyLayerProvider zOffset="navbarPopover">
                <PresenceMenu collapse={shouldRender('collapsed-presence-menu')} />
              </LegacyLayerProvider>

              {shouldRender('login-status') && (
                <LegacyLayerProvider zOffset="navbarPopover">
                  <LoginStatus onLogout={onUserLogout} />
                </LegacyLayerProvider>
              )}

              {shouldRender('search-button') && (
                <Button icon={SearchIcon} mode="bleed" onClick={onSearchOpen} />
              )}
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </Root>

    // <Card className={className} data-search-open={searchIsOpen} scheme="dark">
    //   <div className={styles.hamburger}>
    //     <Button
    //       aria-label="Open menu"
    //       icon={HamburgerIcon}
    //       kind="simple"
    //       onClick={onToggleMenu}
    //       padding="small"
    //       title="Open menu"
    //       tone="navbar"
    //     />
    //   </div>
    //   <div className={styles.branding}>
    //     <StateLink state={rootState} className={styles.brandingLink}>
    //       <Branding projectName={config && config.project.name} />
    //     </StateLink>
    //   </div>
    //   {HAS_SPACES && (
    //     <div className={styles.datasetSelect}>
    //       <DatasetSelect isVisible={showToolMenu} tone="navbar" />
    //     </div>
    //   )}
    //   <div className={styles.createButton}>
    //     <LegacyLayerProvider zOffset="navbarPopover">
    //       <Tooltip
    //         content={
    //           createAnyPermission.granted ? (
    //             <span className={styles.createButtonTooltipContent}>Create new document</span>
    //           ) : (
    //             <Card padding={2} radius={1}>
    //               <InsufficientPermissionsMessage
    //                 currentUser={currentUser}
    //                 operationLabel="create any document"
    //               />
    //             </Card>
    //           )
    //         }
    //       >
    //         <div>
    //           <Button
    //             aria-label="Create"
    //             data-testid="default-layout-global-create-button"
    //             icon={ComposeIcon}
    //             kind="simple"
    //             onClick={onCreateButtonClick}
    //             padding="small"
    //             disabled={!createAnyPermission.granted}
    //             selected={createMenuIsOpen}
    //             tone="navbar"
    //           />
    //         </div>
    //       </Tooltip>
    //     </LegacyLayerProvider>
    //   </div>
    //   <div className={searchClassName} ref={onSetSearchElement}>
    //     <div>
    //       <SearchContainer
    //         shouldBeFocused={searchIsOpen}
    //         onOpen={onSearchOpen}
    //         onClose={onSearchClose}
    //       />
    //     </div>
    //   </div>
    //   <div className={styles.toolSwitcher}>
    //     {tools.length > 1 && (
    //       <ToolMenu
    //         direction="horizontal"
    //         isVisible={showToolMenu}
    //         tools={tools}
    //         activeToolName={tool}
    //         onSwitchTool={onSwitchTool}
    //         router={router}
    //         showLabel={showLabel}
    //         tone="navbar"
    //       />
    //     )}
    //   </div>
    //   <div className={styles.extras}>{/* Insert plugins here */}</div>
    //   <div className={styles.sanityStatus}>
    //     <SanityStatusContainer />
    //   </div>
    //   {sidecar && sidecar.isSidecarEnabled && sidecar.isSidecarEnabled() && (
    //     <div className={styles.helpButton}>
    //       {sidecar && createElement(sidecar.SidecarToggleButton)}
    //     </div>
    //   )}
    //   <div className={styles.presenceStatus}>
    //     <PresenceMenu />
    //   </div>
    //   <div className={styles.loginStatus} ref={onSetLoginStatusElement}>
    //     <LoginStatus onLogout={onUserLogout} />
    //   </div>
    //   <div className={styles.searchButton}>
    //     <Button
    //       icon={SearchIcon}
    //       kind="simple"
    //       onClick={onSearchOpen}
    //       padding="small"
    //       tone="navbar"
    //     />
    //   </div>
    // </Card>
  )
}
