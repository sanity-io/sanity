import PropTypes from 'prop-types'
import React from 'react'
import schema from 'part:@sanity/base/schema'
import CloseIcon from 'part:@sanity/base/close-icon'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import DataAspectsResolver from 'part:@sanity/data-aspects/resolver'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'
import {RouteScope, withRouterHOC} from 'part:@sanity/base/router'
import absolutes from 'all:part:@sanity/base/absolutes'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import userStore from 'part:@sanity/base/user'
import {HAS_SPACES} from '../util/spaces'
import styles from './styles/DefaultLayout.css'
import RenderTool from './RenderTool'
import ActionModal from './ActionModal'
import NavBar from './NavBar'
import {SchemaErrorReporter} from './SchemaErrorReporter'
import SpaceSwitcher from './SpaceSwitcher'
import UpdateNotifier from './UpdateNotifier'

const dataAspects = new DataAspectsResolver(schema)

export default withRouterHOC(
  class DefaultLayout extends React.Component {
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

    componentWillMount() {
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
        this._loadingScreenElement.removeEventListener(
          'animationend',
          this.handleAnimationEnd,
          false
        )
      }
    }

    handleAnimationEnd = event => {
      this.setState({
        showLoadingScreen: false
      })
    }

    componentDidUpdate(prevProps) {
      if (!this.state.loaded) {
        this.setState({
          loaded: true
        })
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
      if (window && !window.matchMedia('all and (min-width: 32em)').matches) {
        this.setState({
          menuIsOpen: false
        })
      }
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

      const TYPE_ITEMS = dataAspects
        .getInferredTypes()
        .filter(typeName => isActionEnabled(schema.get(typeName), 'create'))
        .map(typeName => ({
          key: typeName,
          name: typeName,
          title: dataAspects.getDisplayName(typeName),
          icon: dataAspects.getIcon(typeName)
        }))

      const modalActions = TYPE_ITEMS.map(item => ({
        title: item.title,
        icon: item.icon,
        params: {type: item.name}
      }))

      const isOverlayVisible = menuIsOpen || searchIsOpen
      let className = styles.root
      if (isOverlayVisible) className += ` ${styles.isOverlayVisible}`

      return (
        <div className={className}>
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
            <NavBar
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

          <div className={styles.mainArea}>
            <div className={menuIsOpen ? styles.menuIsOpen : styles.menuIsClosed}>
              <div>
                <button
                  className={styles.menuCloseButton}
                  type="button"
                  onClick={this.handleToggleMenu}
                  title="Close menu"
                >
                  <CloseIcon />
                </button>

                <div className={styles.userProfile}>
                  <div className={styles.userProfileImage}>
                    <img src={this.state.user.profileImage} />
                  </div>
                  <div className={styles.userProfileText}>{this.state.user.name}</div>
                </div>

                {HAS_SPACES && (
                  <div className={styles.spaceSwitcher}>
                    <SpaceSwitcher />
                  </div>
                )}
                <ToolSwitcher
                  direction="vertical"
                  tools={this.props.tools}
                  activeToolName={router.state.tool}
                  onSwitchTool={this.handleSwitchTool}
                />
                <div className={styles.menuBottom}>
                  <UpdateNotifier />
                  <a className={styles.sanityStudioLogoContainer} href="http://sanity.io">
                    <SanityStudioLogo />
                  </a>
                </div>

                {/* TODO: add user sign out action */}
              </div>
            </div>
            <div className={styles.toolContainer}>
              <RouteScope scope={router.state.tool}>
                <RenderTool tool={router.state.tool} />
              </RouteScope>
            </div>
          </div>

          {createMenuIsOpen && (
            <ActionModal onClose={this.handleActionModalClose} actions={modalActions} />
          )}
          {absolutes.map((Abs, i) => <Abs key={i} />)}
        </div>
      )
    }

    render() {
      return <SchemaErrorReporter>{this.renderContent}</SchemaErrorReporter>
    }
  }
)
