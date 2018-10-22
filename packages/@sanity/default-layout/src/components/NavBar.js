import PropTypes from 'prop-types'
import React from 'react'
import Ink from 'react-ink'
import config from 'config:sanity'
import PlusIcon from 'part:@sanity/base/plus-icon'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import Branding from './Branding'
import LoginStatus from './LoginStatus'
import SearchController from './SearchController'
import styles from './styles/NavBar.css'
import {StateLink} from 'part:@sanity/base/router'

function NavBar(props) {
  const {onCreateButtonClick, onToggleMenu, onSwitchTool, onUserLogout, router, tools, user} = props

  return (
    <div className={styles.root}>
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
        <span className={styles.createButtonIcon}>
          <PlusIcon />
        </span>
        <span className={styles.createButtonText}>New</span>
        <Ink duration={200} opacity={0.1} radius={200} />
      </a>
      <div className={styles.toolSwitcher}>
        <ToolSwitcher
          direction="horizontal"
          tools={tools}
          activeToolName={router.state.tool}
          onSwitchTool={onSwitchTool}
        />
      </div>
      <div className={styles.search}>
        <SearchController />
      </div>
      <div className={styles.extras}>{/* Insert plugins here */}</div>
      <div className={styles.loginStatus}>
        <LoginStatus onLogout={onUserLogout} user={user} />
      </div>
    </div>
  )
}

NavBar.propTypes = {
  onCreateButtonClick: PropTypes.func.isRequired,
  onToggleMenu: PropTypes.func.isRequired,
  onSwitchTool: PropTypes.func.isRequired,
  onUserLogout: PropTypes.func.isRequired,
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
  }).isRequired
}

export default NavBar
