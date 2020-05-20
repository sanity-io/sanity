import PropTypes from 'prop-types'
import React from 'react'
import {Tooltip} from 'react-tippy'
import config from 'config:sanity'
import PlusIcon from 'part:@sanity/base/plus-icon'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import SearchIcon from 'part:@sanity/base/search-icon'
import {StateLink} from 'part:@sanity/base/router'
import * as sidecar from 'part:@sanity/default-layout/sidecar?'
import {HAS_SPACES} from '../util/spaces'
import Branding from './branding/Branding'
import LoginStatus from './loginStatus/LoginStatus'
import SanityStatusContainer from './studioStatus/SanityStatusContainer'
import SearchContainer from './search/SearchContainer'
import SpaceSwitcher from './datasetSelect/SpaceSwitcher'
import styles from './NavBar.css'

let isSidecarEnabled
let SidecarToggleButton
if (sidecar) {
  isSidecarEnabled = sidecar.isSidecarEnabled
  SidecarToggleButton = sidecar.SidecarToggleButton
}

function NavBar(props) {
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
        <div className={styles.spaceSwitcher}>
          <SpaceSwitcher isVisible={showToolSwitcher} />
        </div>
      )}
      <button className={styles.createButton} onClick={onCreateButtonClick} type="button">
        <Tooltip
          disabled={'ontouchstart' in document.documentElement}
          title="Create new document"
          arrow
          inertia
          theme="dark"
          distance="7"
          sticky
          size="small"
        >
          <div className={styles.createButtonInner} tabIndex={-1}>
            <div className={styles.createButtonIcon}>
              <PlusIcon />
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
          showLabel={showLabel}
        />
      </div>
      <div className={styles.extras}>{/* Insert plugins here */}</div>
      <div className={styles.sanityStatus}>
        <SanityStatusContainer />
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

NavBar.defaultProps = {
  showLabel: true,
  showToolSwitcher: true,
  onSetLoginStatusElement: undefined,
  onSetSearchElement: undefined
}

NavBar.propTypes = {
  searchIsOpen: PropTypes.bool.isRequired,
  onCreateButtonClick: PropTypes.func.isRequired,
  onToggleMenu: PropTypes.func.isRequired,
  onSwitchTool: PropTypes.func.isRequired,
  onUserLogout: PropTypes.func.isRequired,
  onSearchOpen: PropTypes.func.isRequired,
  onSearchClose: PropTypes.func.isRequired,
  onSetLoginStatusElement: PropTypes.func,
  onSetSearchElement: PropTypes.func,
  router: PropTypes.shape({
    state: PropTypes.shape({tool: PropTypes.string, space: PropTypes.string}),
    navigate: PropTypes.func
  }).isRequired,
  tools: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string
    })
  ).isRequired,
  user: PropTypes.shape({
    name: PropTypes.string,
    profileImage: PropTypes.string
  }).isRequired,
  showLabel: PropTypes.bool,
  showToolSwitcher: PropTypes.bool
}

export default NavBar
