import PropTypes from 'prop-types'
import React from 'react'
import LoginStatus from './LoginStatus'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import styles from './styles/MobileNavigation.css'
import Branding from './Branding'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import Button from 'part:@sanity/components/buttons/default'
import Search from './Search'
import {WithRouter} from 'part:@sanity/base/router'
import SpaceSwitcher from './SpaceSwitcher'

export default class MobileNavigation extends React.Component {
  static propTypes = {
    tools: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string
      })
    )
  }
  state = {
    isOpen: false
  }

  handleOpen = event => {
    this.setState({
      isOpen: true
    })
  }

  handleClose = event => {
    this.setState({
      isOpen: false
    })
  }

  handleToggle = () => {
    this.setState({
      isOpen: !this.state.isOpen
    })
  }

  render() {
    const {isOpen} = this.state
    const {tools} = this.props
    return (
      <div className={styles.root}>
        <Button
          kind="simple"
          className={styles.hamburgerButton}
          onClick={this.handleToggle}
          title="Menu"
          icon={HamburgerIcon}
        />
        <div className={styles.headerBackground} />

        <div className={`${isOpen ? styles.menuOpen : styles.menuClosed}`}>
          <div className={styles.searchContainer}>
            <Search onSelect={this.handleClose} />
          </div>
          <SpaceSwitcher />
          <LoginStatus className={styles.loginStatus} />
          <WithRouter>
            {router => (
              <ToolSwitcher
                tools={tools}
                activeToolName={router.state.tool}
                className={styles.toolSwitcher}
                onClick={this.handleClose}
              />
            )}
          </WithRouter>
        </div>
      </div>
    )
  }
}
