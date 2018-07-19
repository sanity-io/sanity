import PropTypes from 'prop-types'
import React from 'react'
import {RouteScope, withRouterHOC} from 'part:@sanity/base/router'
import absolutes from 'all:part:@sanity/base/absolutes'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import styles from './styles/DefaultLayout.css'
import RenderTool from './RenderTool'
import Navigation from './Navigation'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import PlusIcon from 'part:@sanity/base/plus-icon'
import ActionModal from './ActionModal'
import schema from 'part:@sanity/base/schema'
import DataAspectsResolver from 'part:@sanity/data-aspects/resolver'
import Branding from './Branding'
import Ink from 'react-ink'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import Button from 'part:@sanity/components/buttons/default'
import {SchemaErrorReporter} from './SchemaErrorReporter'
import SpaceSwitcher from './SpaceSwitcher'
import {HAS_SPACES} from '../util/spaces'
import UpdateNotifier from './UpdateNotifier'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'

const dataAspects = new DataAspectsResolver(schema)

export default withRouterHOC(
  class DefaultLayout extends React.Component {
    static propTypes = {
      router: PropTypes.shape({
        state: PropTypes.object,
        navigate: PropTypes.func
      }),
      tools: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string
        })
      )
    }

    state = {
      createMenuIsOpen: false,
      mobileMenuIsOpen: false,
      showLoadingScreen: true,
      loaded: false
    }

    componentDidMount() {
      if (this._loadingScreenElement && this.state.showLoadingScreen) {
        this._loadingScreenElement.addEventListener('animationend', this.handleAnimationEnd, false)
      }
    }

    componentWillUnmount() {
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
      this.setState({
        createMenuIsOpen: !this.state.createMenuIsOpen
      })
    }

    handleActionModalClose = () => {
      this.setState({
        createMenuIsOpen: false
      })
    }

    handleMobileMenuToggle = () => {
      this.setState({
        mobileMenuIsOpen: !this.state.mobileMenuIsOpen
      })
    }

    handleSwitchTool = () => {
      this.setState({
        mobileMenuIsOpen: false
      })
    }

    setLoadingScreenElement = element => {
      this._loadingScreenElement = element
    }

    renderContent = () => {
      const {tools, router} = this.props
      const {createMenuIsOpen, mobileMenuIsOpen} = this.state

      const TYPE_ITEMS = dataAspects.getInferredTypes().map(typeName => ({
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

      return (
        <div
          className={`${styles.defaultLayout} ${mobileMenuIsOpen ? styles.mobileMenuIsOpen : ''}`}
        >
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
          <div className={styles.secondaryNavigation}>
            <div className={styles.branding}>
              <Branding />
            </div>
            {HAS_SPACES && (
              <div className={styles.spaceSwitcher}>
                <SpaceSwitcher />
              </div>
            )}
            <a className={styles.createButton} onClick={this.handleCreateButtonClick}>
              <span className={styles.createButtonIcon}>
                <PlusIcon />
              </span>
              <span className={styles.createButtonText}>New</span>
              <Ink duration={200} opacity={0.1} radius={200} />
            </a>
            <div className={styles.mobileCreateButton}>
              <Button
                kind="simple"
                onClick={this.handleCreateButtonClick}
                title="Create new item"
                icon={PlusIcon}
              >
                New
              </Button>
            </div>

            <div className={styles.mobileMenuButton}>
              <Button
                kind="simple"
                onClick={this.handleMobileMenuToggle}
                title="Menu"
                icon={HamburgerIcon}
              />
            </div>
            <ToolSwitcher
              tools={this.props.tools}
              activeToolName={router.state.tool}
              onSwitchTool={this.handleSwitchTool}
              className={styles.toolSwitcher}
            />
          </div>
          <div className={styles.mainArea}>
            <div className={styles.navigation}>
              <Navigation tools={tools} />
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

          <UpdateNotifier />

          <a className={styles.sanityStudioLogoContainer} href="http://sanity.io">
            <SanityStudioLogo />
          </a>

          {absolutes.map((Abs, i) => <Abs key={i} />)}
        </div>
      )
    }

    render() {
      return <SchemaErrorReporter>{this.renderContent}</SchemaErrorReporter>
    }
  }
)
