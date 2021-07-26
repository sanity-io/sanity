import classNames from 'classnames'
import React, {createElement} from 'react'
import config from 'config:sanity'
import ComposeIcon from 'part:@sanity/base/compose-icon'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import {StateLink} from 'part:@sanity/base/router'
import SearchIcon from 'part:@sanity/base/search-icon'
import Button from 'part:@sanity/components/buttons/default'
import * as sidecar from 'part:@sanity/default-layout/sidecar?'
import ToolMenu from 'part:@sanity/default-layout/tool-switcher'
import {LegacyLayerProvider, InsufficientPermissionsMessage} from '@sanity/base/components'
// eslint-disable-next-line camelcase
import {unstable_useCanCreateAnyOf, useCurrentUser} from '@sanity/base/hooks'
import {Card, Tooltip} from '@sanity/ui'
import {DatasetSelect} from '../components'
import {HAS_SPACES} from '../util/spaces'
import {Router, Tool} from '../types'
import Branding from './branding/Branding'
import LoginStatus from './loginStatus/LoginStatus'
import SanityStatusContainer from './studioStatus/SanityStatusContainer'
import {PresenceMenu} from './presenceMenu'
import SearchContainer from './search/SearchContainer'

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

  return (
    <Card className={className} data-search-open={searchIsOpen} scheme="dark">
      <div className={styles.hamburger}>
        <Button
          aria-label="Open menu"
          icon={HamburgerIcon}
          kind="simple"
          onClick={onToggleMenu}
          padding="small"
          title="Open menu"
          tone="navbar"
        />
      </div>
      <div className={styles.branding}>
        <StateLink state={rootState} className={styles.brandingLink}>
          <Branding projectName={config && config.project.name} />
        </StateLink>
      </div>
      {HAS_SPACES && (
        <div className={styles.datasetSelect}>
          <DatasetSelect isVisible={showToolMenu} tone="navbar" />
        </div>
      )}
      <div className={styles.createButton}>
        <LegacyLayerProvider zOffset="navbarPopover">
          <Tooltip
            content={
              createAnyPermission.granted ? (
                <span className={styles.createButtonTooltipContent}>Create new document</span>
              ) : (
                <Card padding={2} radius={1}>
                  <InsufficientPermissionsMessage
                    currentUser={currentUser}
                    operationLabel="create any document"
                  />
                </Card>
              )
            }
          >
            <div>
              <Button
                aria-label="Create"
                data-testid="default-layout-global-create-button"
                icon={ComposeIcon}
                kind="simple"
                onClick={onCreateButtonClick}
                padding="small"
                disabled={!createAnyPermission.granted}
                selected={createMenuIsOpen}
                tone="navbar"
              />
            </div>
          </Tooltip>
        </LegacyLayerProvider>
      </div>
      <div className={searchClassName} ref={onSetSearchElement}>
        <div>
          <SearchContainer
            shouldBeFocused={searchIsOpen}
            onOpen={onSearchOpen}
            onClose={onSearchClose}
          />
        </div>
      </div>
      <div className={styles.toolSwitcher}>
        {tools.length > 1 && (
          <ToolMenu
            direction="horizontal"
            isVisible={showToolMenu}
            tools={tools}
            activeToolName={tool}
            onSwitchTool={onSwitchTool}
            router={router}
            showLabel={showLabel}
            tone="navbar"
          />
        )}
      </div>
      <div className={styles.extras}>{/* Insert plugins here */}</div>
      <div className={styles.sanityStatus}>
        <SanityStatusContainer />
      </div>
      {sidecar && sidecar.isSidecarEnabled && sidecar.isSidecarEnabled() && (
        <div className={styles.helpButton}>
          {sidecar && createElement(sidecar.SidecarToggleButton)}
        </div>
      )}
      <div className={styles.presenceStatus}>
        <PresenceMenu />
      </div>
      <div className={styles.loginStatus} ref={onSetLoginStatusElement}>
        <LoginStatus onLogout={onUserLogout} />
      </div>
      <div className={styles.searchButton}>
        <Button
          icon={SearchIcon}
          kind="simple"
          onClick={onSearchOpen}
          padding="small"
          tone="navbar"
        />
      </div>
    </Card>
  )
}
