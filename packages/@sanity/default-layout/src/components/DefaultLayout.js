import PropTypes from 'prop-types'
import React from 'react'
import Ink from 'react-ink'
import schema from 'part:@sanity/base/schema'
import Button from 'part:@sanity/components/buttons/default'
import PlusIcon from 'part:@sanity/base/plus-icon'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import DataAspectsResolver from 'part:@sanity/data-aspects/resolver'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'
import {RouteScope, withRouterHOC} from 'part:@sanity/base/router'
import absolutes from 'all:part:@sanity/base/absolutes'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import {HAS_SPACES} from '../util/spaces'
import styles from './styles/DefaultLayout.css'
import RenderTool from './RenderTool'
import LoginStatus from './LoginStatus'
import Search from './Search'
import ActionModal from './ActionModal'
import Branding from './Branding'
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

    setLoadingScreenElement = element => {
      this._loadingScreenElement = element
    }

    renderContent = () => {
      const {tools, router} = this.props
      const {createMenuIsOpen, menuIsOpen} = this.state

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

      return (
        <div className={styles.root}>
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

          <div className={styles.top}>
            <div className={styles.hamburger}>
              <Button
                kind="simple"
                onClick={this.handleToggleMenu}
                title="Menu"
                icon={HamburgerIcon}
              />
            </div>
            <div className={styles.branding}>
              <Branding />
            </div>
            <a className={styles.createButton} onClick={this.handleCreateButtonClick}>
              <span className={styles.createButtonIcon}>
                <PlusIcon />
              </span>
              <span className={styles.createButtonText}>New</span>
              <Ink duration={200} opacity={0.1} radius={200} />
            </a>
            <div className={styles.toolSwitcher}>
              <ToolSwitcher
                layout="mini"
                tools={this.props.tools}
                activeToolName={router.state.tool}
                onSwitchTool={this.handleSwitchTool}
              />
            </div>
            <div className={styles.search}>
              <Search />
            </div>
            <div className={styles.extras}>{/* Insert plugins here */}</div>
            <div className={styles.loginStatus}>
              <LoginStatus />
            </div>
          </div>

          <div className={styles.mainArea}>
            <div className={menuIsOpen ? styles.menuIsOpen : styles.menuIsClosed}>
              {HAS_SPACES && (
                <div className={styles.spaceSwitcher}>
                  <SpaceSwitcher />
                </div>
              )}
              <ToolSwitcher
                layout="default"
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
