import classNames from 'classnames'
import React, {createElement} from 'react'
import config from 'config:sanity'
import ComposeIcon from 'part:@sanity/base/compose-icon'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import {StateLink} from 'part:@sanity/base/router'
import SearchIcon from 'part:@sanity/base/search-icon'
import Button from 'part:@sanity/components/buttons/default'
import {Tooltip} from 'part:@sanity/components/tooltip'
import * as sidecar from 'part:@sanity/default-layout/sidecar?'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import {HAS_SPACES} from '../util/spaces'
import {Router, Tool} from '../types'
import Branding from './branding/Branding'
import LoginStatus from './loginStatus/LoginStatus'
import SanityStatusContainer from './studioStatus/SanityStatusContainer'
import {PresenceMenu} from './presenceMenu'
import SearchContainer from './search/SearchContainer'
import DatasetSelect from './datasetSelect/DatasetSelect'

import styles from './Navbar.css'

interface Props {
  searchIsOpen: boolean
  onCreateButtonClick: () => void
  onSearchClose: () => void
  onSearchOpen: () => void
  onSetLoginStatusElement: (element: HTMLDivElement) => void
  onSetSearchElement: (element: HTMLDivElement) => void
  onSwitchTool: () => void
  onToggleMenu: () => void
  onUserLogout: () => void
  router: Router
  showLabel: boolean
  showToolSwitcher: boolean
  tools: Tool[]
}

const TOUCH_DEVICE = 'ontouchstart' in document.documentElement

// eslint-disable-next-line complexity
function Navbar(props: Props) {
  const {
    searchIsOpen,
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
    showLabel,
    showToolSwitcher
  } = props

  const rootState = HAS_SPACES && router.state.space ? {space: router.state.space} : {}
  const className = classNames(styles.root, showToolSwitcher && styles.withToolSwitcher)
  const searchClassName = classNames(styles.search, searchIsOpen && styles.searchIsOpen)

  return (
    <div className={className} data-search-open={searchIsOpen}>
      <div className={styles.hamburger}>
        <Button
          aria-label="Open menu"
          icon={HamburgerIcon}
          kind="simple"
          onClick={onToggleMenu}
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
          <DatasetSelect isVisible={showToolSwitcher} tone="navbar" />
        </div>
      )}
      <div className={styles.createButton}>
        <Tooltip
          disabled={TOUCH_DEVICE}
          content={
            (<span className={styles.createButtonTooltipContent}>Create new document</span>) as any
          }
          tone="navbar"
        >
          <div>
            <Button
              aria-label="Create"
              icon={ComposeIcon}
              kind="simple"
              onClick={onCreateButtonClick}
              tone="navbar"
            />
          </div>
        </Tooltip>
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
        <ToolSwitcher
          direction="horizontal"
          isVisible={showToolSwitcher}
          tools={tools}
          activeToolName={router.state.tool}
          onSwitchTool={onSwitchTool}
          router={router}
          showLabel={showLabel}
          tone="navbar"
        />
      </div>
      <div className={styles.extras}>{/* Insert plugins here */}</div>
      <div className={styles.sanityStatus}>
        <SanityStatusContainer />
      </div>
      <div className={styles.presenceStatus}>
        <PresenceMenu />
      </div>
      {sidecar && sidecar.isSidecarEnabled && sidecar.isSidecarEnabled() && (
        <div className={styles.sidecarStatus}>
          {sidecar && sidecar.SidecarLayout && createElement(sidecar.SidecarLayout)}
        </div>
      )}
      <div className={styles.loginStatus} ref={onSetLoginStatusElement}>
        <LoginStatus onLogout={onUserLogout} />
      </div>
      <div className={styles.searchButton}>
        <Button icon={SearchIcon} kind="simple" onClick={onSearchOpen} tone="navbar" />
      </div>
    </div>
  )
}

export default Navbar
