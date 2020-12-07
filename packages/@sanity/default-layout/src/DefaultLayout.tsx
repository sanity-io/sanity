import {Layer} from '@sanity/ui'
import React from 'react'
import {Subscription} from 'rxjs'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'
import {RouteScope, withRouterHOC} from 'part:@sanity/base/router'
import absolutes from 'all:part:@sanity/base/absolutes'
import userStore from 'part:@sanity/base/user'
import Sidecar from './addons/Sidecar'
import RenderTool from './main/RenderTool'
import ActionModal from './actionModal/ActionModal'
import NavbarContainer from './navbar/NavbarContainer'
import {SchemaErrorReporter} from './schemaErrors/SchemaErrorReporter'
import {SideMenu} from './sideMenu'
import getNewDocumentModalActions from './util/getNewDocumentModalActions'
import {Router, Tool, User} from './types'

import styles from './DefaultLayout.css'

interface OuterProps {
  tools: Tool[]
}

interface Props {
  router: Router
  tools: Tool[]
}

interface State {
  createMenuIsOpen: boolean
  menuIsOpen: boolean
  showLoadingScreen: boolean
  searchIsOpen: boolean
  loaded: boolean
  user?: User
}

class DefaultLayout extends React.PureComponent<Props, State> {
  state: State = {
    createMenuIsOpen: false,
    menuIsOpen: false,
    showLoadingScreen: true,
    searchIsOpen: false,
    loaded: false,
  }

  userSubscription: Subscription | null = null

  _loadingScreenElement: HTMLDivElement | null = null

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    this.userSubscription = userStore.currentUser.subscribe((event) =>
      this.setState({user: event.type === 'snapshot' ? event.user : null})
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

  handleClickCapture = (event) => {
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

  handleAnimationEnd = () => {
    this.setState({
      showLoadingScreen: false,
    })
  }

  componentDidUpdate() {
    if (!this.state.loaded) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({loaded: true})
    }
  }

  handleCreateButtonClick = () => {
    this.setState((prevState) => ({
      createMenuIsOpen: !prevState.createMenuIsOpen,
    }))
  }

  handleActionModalClose = () => {
    this.setState({
      createMenuIsOpen: false,
    })
  }

  handleToggleMenu = () => {
    this.setState((prevState) => ({
      menuIsOpen: !prevState.menuIsOpen,
    }))
  }

  handleSwitchTool = () => {
    this.setState({
      menuIsOpen: false,
    })
  }

  handleSearchOpen = () => {
    this.setState({searchIsOpen: true})
  }

  handleSearchClose = () => {
    this.setState({searchIsOpen: false})
  }

  setLoadingScreenElement = (element) => {
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
          <Layer
            className={
              this.state.loaded || document.visibilityState == 'hidden'
                ? styles.loadingScreenLoaded
                : styles.loadingScreen
            }
            zOffset={5000}
            ref={this.setLoadingScreenElement}
          >
            <AppLoadingScreen text="Restoring Sanity" />
          </Layer>
        )}

        <div className={styles.navbar}>
          <NavbarContainer
            tools={tools}
            createMenuIsOpen={createMenuIsOpen}
            onCreateButtonClick={this.handleCreateButtonClick}
            onToggleMenu={this.handleToggleMenu}
            onSwitchTool={this.handleSwitchTool}
            router={router}
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
            router={router}
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

          <div className={styles.sidecarContainer}>
            <Sidecar />
          </div>
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

export default (withRouterHOC(DefaultLayout as any) as any) as React.ComponentType<OuterProps>
