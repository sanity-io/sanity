import PropTypes from 'prop-types'
import React from 'react'
import {RouteScope, withRouterHOC} from 'part:@sanity/base/router'
import userStore from 'part:@sanity/base/user'
import styles from './styles/DefaultLayout.css'
import RenderTool from './RenderTool'

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
        this._loadingScreenElement.removeEventListener(
          'animationend',
          this.handleAnimationEnd,
          false
        )
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
      const {router} = this.props

      return (
        <RouteScope scope={router.state.tool}>
          <RenderTool tool={router.state.tool} />
        </RouteScope>
      )
    }

    render() {
      return this.renderContent()
    }
  }
)
