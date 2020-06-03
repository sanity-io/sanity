import React from 'react'
import config from 'config:sanity'
import ComposeIcon from 'part:@sanity/base/compose-icon'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import SearchIcon from 'part:@sanity/base/search-icon'
import {StateLink} from 'part:@sanity/base/router'
import * as sidecar from 'part:@sanity/default-layout/sidecar?'
import {HAS_SPACES} from '../util/spaces'
import Branding from './branding/Branding'
import LoginStatus from './loginStatus/LoginStatus'
import SanityStatusContainer from './studioStatus/SanityStatusContainer'
import {GlobalPresence} from './studioStatus/GlobalPresence'
import SearchContainer from './search/SearchContainer'
import DatasetSelect from './datasetSelect/DatasetSelect'
import {Tooltip} from './tooltip'
import {Router, Tool, User} from '../types'

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
  user?: User
}

const TOUCH_DEVICE = 'ontouchstart' in document.documentElement

let isSidecarEnabled: () => boolean
let SidecarToggleButton: React.ComponentType<{}>
if (sidecar) {
  isSidecarEnabled = sidecar.isSidecarEnabled
  SidecarToggleButton = sidecar.SidecarToggleButton
}

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
    user,
    showLabel,
    showToolSwitcher
  } = props
  let searchClassName = styles.search
  if (searchIsOpen) searchClassName += ` ${styles.searchIsOpen}`
  let className = styles.root
  if (showToolSwitcher) className += ` ${styles.withToolSwitcher}`

  const rootState = HAS_SPACES && router.state.space ? {space: router.state.space} : {}

  return (
    <div className={className} data-search-open={searchIsOpen}>
      <div className={styles.hamburger}>
        <button
          className={styles.hamburgerButton}
          type="button"
          title="Open menu"
          onClick={onToggleMenu}
        >
          <div className={styles.hamburgerButtonInner} tabIndex={-1}>
            <HamburgerIcon />
          </div>
        </button>
      </div>
      <StateLink state={rootState} className={styles.branding}>
        <Branding projectName={config && config.project.name} />
      </StateLink>
      {HAS_SPACES && (
        <div className={styles.datasetSelect}>
          <DatasetSelect isVisible={showToolSwitcher} />
        </div>
      )}
      <button className={styles.createButton} onClick={onCreateButtonClick} type="button">
        <Tooltip disabled={TOUCH_DEVICE} content={<>Create new document</>}>
          <div className={styles.createButtonInner} tabIndex={-1}>
            <div className={styles.createButtonIcon}>
              <ComposeIcon />
            </div>
            <span className={styles.createButtonText}>New</span>
          </div>
        </Tooltip>
      </button>
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
        />
      </div>
      <div className={styles.extras}>{/* Insert plugins here */}</div>
      <div className={styles.sanityStatus}>
        <SanityStatusContainer />
      </div>
      <div className={styles.presenceStatus}>
        <GlobalPresence />
      </div>
      {isSidecarEnabled && isSidecarEnabled() && (
        <div className={styles.sidecarStatus}>
          <SidecarToggleButton />
        </div>
      )}
      <div className={styles.loginStatus} ref={onSetLoginStatusElement}>
        <LoginStatus onLogout={onUserLogout} user={user} />
      </div>
      <button className={styles.searchButton} onClick={onSearchOpen} type="button">
        <div className={styles.searchButtonInner} tabIndex={-1}>
          <span className={styles.searchButtonIcon}>
            <SearchIcon />
          </span>
          <span className={styles.searchButtonText}>Search</span>
        </div>
      </button>
    </div>
  )
}

Navbar.defaultProps = {
  showLabel: true,
  showToolSwitcher: true,
  onSetLoginStatusElement: undefined,
  onSetSearchElement: undefined
}

export default Navbar
