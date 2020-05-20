import PropTypes from 'prop-types'
import React from 'react'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'
import {RouteScope, withRouterHOC} from 'part:@sanity/base/router'
import absolutes from 'all:part:@sanity/base/absolutes'
import userStore from 'part:@sanity/base/user'
import Sidecar from './addons/Sidecar'
import RenderTool from './main/RenderTool'
import ActionModal from './navbar/actionButton/ActionModal'
import SideMenu from './navbar/drawer/SideMenu'
import NavBarContainer from './navbar/NavBarContainer'
import {SchemaErrorReporter} from './schemaErrors/SchemaErrorReporter'
import getNewDocumentModalActions from './util/getNewDocumentModalActions'

import styles from './DefaultLayout.css'

class DefaultLayout extends React.PureComponent {
  static propTypes = {
    router: PropTypes.shape({
      state: PropTypes.shape({tool: PropTypes.string}),
      navigate: PropTypes.func
    }).isRequired,
    tools: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string
      })
    ).isRequired
  }

  state = {
    createMenuIsOpen: false,
    menuIsOpen: false,
    showLoadingScreen: true,
    searchIsOpen: false,
    loaded: false
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    this.userSubscription = userStore.currentUser.subscribe(event =>
      this.setState({user: event.user})
    )
  }

  componentDidMount() {
    if (this._loadingScreenElement && this.state.showLoadingScreen) {
      this._loadingScreenElement.addEventListener('animationend', this.handleAnimationEnd, false)
    }
  }

  componentWillUnmount() {
    this.userSubscription.unsubscribe()
    if (this._loadingScreenElement) {
      this._loadingScreenElement.removeEventListener('animationend', this.handleAnimationEnd, false)
    }
  }

  handleClickCapture = event => {
    // Do not handle click if the event is not within DefaultLayout (portals)
    const rootTarget = event.target.closest(`.${styles.root}`)
    if (!rootTarget) return

    if (this.state.menuIsOpen) {
      // Close SideMenu if the user clicks outside
      const menuTarget = event.target.closest(`.${styles.sideMenuContainer}`)
      if (!menuTarget) {
        event.preventDefault()
        event.stopPropagation()
        this.handleToggleMenu()
      }
    }
  }

  handleAnimationEnd = event => {
    this.setState({
      showLoadingScreen: false
    })
  }

  componentDidUpdate(prevProps) {
    if (!this.state.loaded) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({loaded: true})
    }
  }

  handleCreateButtonClick = () => {
    this.setState(prevState => ({
      createMenuIsOpen: !prevState.createMenuIsOpen
    }))
  }

  handleActionModalClose = () => {
    this.setState({
      createMenuIsOpen: false
    })
  }

  handleToggleMenu = () => {
    this.setState(prevState => ({
      menuIsOpen: !prevState.menuIsOpen
    }))
  }

  handleSwitchTool = () => {
    this.setState({
      menuIsOpen: false
    })
  }

  handleSearchOpen = () => {
    this.setState({searchIsOpen: true})
  }

  handleSearchClose = () => {
    this.setState({searchIsOpen: false})
  }

  setLoadingScreenElement = element => {
    this._loadingScreenElement = element
  }

  renderContent = () => {
    const {tools, router} = this.props
    const {createMenuIsOpen, menuIsOpen, searchIsOpen} = this.state

    const isOverlayVisible = menuIsOpen || searchIsOpen
    let className = styles.root
    if (isOverlayVisible) className += ` ${styles.isOverlayVisible}`

    return (
      <div className={className} onClickCapture={this.handleClickCapture}>
        {this.state.showLoadingScreen && (
          <div
            className={
              this.state.loaded || document.visibilityState == 'hidden'
                ? styles.loadingScreenLoaded
                : styles.loadingScreen
            }
            ref={this.setLoadingScreenElement}
          >
            <AppLoadingScreen text="Restoring Sanity" />
          </div>
        )}

        <div className={styles.navBar}>
          <NavBarContainer
            tools={tools}
            onCreateButtonClick={this.handleCreateButtonClick}
            onToggleMenu={this.handleToggleMenu}
            onSwitchTool={this.handleSwitchTool}
            router={router}
            user={this.state.user}
            searchIsOpen={searchIsOpen}
            /* eslint-disable-next-line react/jsx-handler-names */
            onUserLogout={userStore.actions.logout}
            onSearchOpen={this.handleSearchOpen}
            onSearchClose={this.handleSearchClose}
          />
        </div>

        <div className={styles.sideMenuContainer}>
          <SideMenu
            activeToolName={router.state.tool}
            isOpen={menuIsOpen}
            onClose={this.handleToggleMenu}
            /* eslint-disable-next-line react/jsx-handler-names */
            onSignOut={userStore.actions.logout}
            onSwitchTool={this.handleSwitchTool}
            tools={this.props.tools}
            user={this.state.user}
          />
        </div>

        <div className={styles.mainArea}>
          <div className={styles.toolContainer}>
            <RouteScope scope={router.state.tool}>
              <RenderTool tool={router.state.tool} />
            </RouteScope>
          </div>
          <Sidecar />
        </div>

        {createMenuIsOpen && (
          <ActionModal
            onClose={this.handleActionModalClose}
            actions={getNewDocumentModalActions()}
          />
        )}

        {absolutes.map((Abs, i) => (
          <Abs key={String(i)} />
        ))}
      </div>
    )
  }

  render() {
    return <SchemaErrorReporter>{this.renderContent}</SchemaErrorReporter>
  }
}

export default withRouterHOC(DefaultLayout)
