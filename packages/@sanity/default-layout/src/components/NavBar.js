import PropTypes from 'prop-types'
import React from 'react'
import Ink from 'react-ink'
import {Tooltip} from 'react-tippy'
import config from 'config:sanity'
import PlusIcon from 'part:@sanity/base/plus-icon'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import SearchIcon from 'part:@sanity/base/search-icon'
import {StateLink} from 'part:@sanity/base/router'
import Branding from './Branding'
import LoginStatus from './LoginStatus'
import SearchContainer from './SearchContainer'
import styles from './styles/NavBar.css'

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
  return (
    <div className={className} data-search-open={searchIsOpen}>
      <div className={styles.hamburger}>
        <button
          className={styles.hamburgerButton}
          type="button"
          title="Menu"
          onClick={onToggleMenu}
        >
          <HamburgerIcon />
        </button>
      </div>
      <StateLink toIndex className={styles.branding}>
        <Branding projectName={config && config.projectName} />
      </StateLink>
      <a className={styles.createButton} onClick={onCreateButtonClick}>
        <Tooltip
          title="Create new document"
          className={styles.createButtonIcon}
          theme="dark"
          size="small"
          distance="18"
          arrow
        >
          <PlusIcon />
          <span className={styles.createButtonText}>New</span>
          <Ink duration={200} opacity={0.1} radius={200} />
        </Tooltip>
      </a>
      <div className={styles.toolSwitcher}>
        <ToolSwitcher
          direction="horizontal"
          tools={tools}
          activeToolName={router.state.tool}
          onSwitchTool={onSwitchTool}
          showLabel={showLabel}
        />
      </div>
      <div className={searchClassName}>
        <div>
          <SearchContainer
            shouldBeFocused={searchIsOpen}
            onOpen={onSearchOpen}
            onClose={onSearchClose}
          />
        </div>
      </div>
      <div className={styles.extras}>{/* Insert plugins here */}</div>
      <div className={styles.loginStatus}>
        <LoginStatus onLogout={onUserLogout} onSetElement={onSetLoginStatusElement} user={user} />
      </div>
      <a className={styles.searchButton} onClick={onSearchOpen}>
        <span className={styles.searchButtonIcon}>
          <SearchIcon />
        </span>
        <span className={styles.searchButtonText}>Search</span>
        <Ink duration={200} opacity={0.1} radius={200} />
      </a>
    </div>
  )
}

NavBar.defaultProps = {
  showLabel: true,
  showToolSwitcher: true,
  onSetLoginStatusElement: undefined
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
  router: PropTypes.shape({
    state: PropTypes.shape({tool: PropTypes.string}),
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
