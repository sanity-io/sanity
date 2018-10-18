import PropTypes from 'prop-types'
import React from 'react'
import Ink from 'react-ink'
import config from 'config:sanity'
import PlusIcon from 'part:@sanity/base/plus-icon'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import Button from 'part:@sanity/components/buttons/default'
import Branding from './Branding'
import LoginStatus from './LoginStatus'
import Search from './Search'
import styles from './styles/NavBar.css'

function NavBar(props) {
  const {onCreateButtonClick, onToggleMenu, onSwitchTool, onUserLogout, router, tools, user} = props

  return (
    <div className={styles.root}>
      <div className={styles.hamburger}>
        <Button kind="simple" onClick={onToggleMenu} title="Menu" icon={HamburgerIcon} />
      </div>
      <div className={styles.branding}>
        <Branding projectName={config && config.projectName} />
      </div>
      <a className={styles.createButton} onClick={onCreateButtonClick}>
        <span className={styles.createButtonIcon}>
          <PlusIcon />
        </span>
        <span className={styles.createButtonText}>New</span>
        <Ink duration={200} opacity={0.1} radius={200} />
      </a>
      <div className={styles.toolSwitcher}>
        <ToolSwitcher
          layout="mini"
          tools={tools}
          activeToolName={router.state.tool}
          onSwitchTool={onSwitchTool}
        />
      </div>
      <div className={styles.search}>
        <Search />
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
