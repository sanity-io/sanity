import React from 'react'
import PropTypes from 'prop-types'
import presenceStore from 'part:@sanity/base/datastore/presence'
import NavBar from './NavBar'

/* eslint-disable complexity */
/* eslint-disable max-depth */
/* eslint-disable no-lonely-if */
function getNextState(state, mostRight, winWidth) {
  const {showLabel, showLabelMinWidth, showToolSwitcher, showToolSwitcherMinWidth} = state
  const mostRightIsVisible = mostRight && mostRight <= winWidth
  const nextState = {winWidth}

  if (mostRightIsVisible) {
    // most-right element is within viewport
    if (showLabel) {
      if (showLabelMinWidth === -1 || winWidth < showLabelMinWidth) {
        nextState.showLabelMinWidth = winWidth
      }
    } else if (showLabelMinWidth < winWidth) {
      nextState.showLabel = true
    }

    if (showToolSwitcher) {
      if (showToolSwitcherMinWidth === -1 || winWidth < showToolSwitcherMinWidth) {
        nextState.showToolSwitcherMinWidth = winWidth
      }
    } else if (showToolSwitcherMinWidth < winWidth) {
      nextState.showToolSwitcher = true
    }
  } else {
    // most-right element is NOT within viewport
    if (showLabel) {
      nextState.showLabel = false
    } else if (showToolSwitcher) {
      nextState.showToolSwitcher = false
    }
  }

  return nextState
}
/* eslint-enable complexity */
/* eslint-enable max-depth */
/* eslint-enable no-lonely-if */

class NavBarContainer extends React.PureComponent {
  state = {
    showLabel: false,
    showLabelMinWidth: -1,
    showToolSwitcher: false,
    showToolSwitcherMinWidth: -1,
    winWidth: -1
  }

  loginStatusElement = null
  searchElement = null
  tickAnimFrameId = null

  componentDidMount() {
    // Start an animation frame loop to check whether elements within the NavBar
    // exits the viewport at any time.
    this.tick()

    // Start listening for presence updates
    this.presence$ = presenceStore.presence.subscribe(this.handleUpdatePresence)
  }

  /* eslint-disable complexity */
  componentDidUpdate(prevProps, prevState) {
    const {showLabel, showLabelMinWidth, showToolSwitcher, showToolSwitcherMinWidth} = this.state
    const didShowLabel = showLabelMinWidth === -1 && !prevState.showLabel && showLabel
    const didShowToolSwitcher =
      showToolSwitcherMinWidth === -1 && !prevState.showToolSwitcher && showToolSwitcher
    const didHideLabel = showToolSwitcherMinWidth === -1 && prevState.showLabel && !showLabel

    if (didShowLabel || didShowToolSwitcher || didHideLabel) {
      this.handleCustomResize(window.innerWidth)
    }
  }
  /* eslint-enable complexity */

  componentWillUnmount() {
    if (this.tickAnimFrameId) {
      window.cancelAnimationFrame(this.tickAnimFrameId)
      this.tickAnimFrameId = null
    }

    if (this.presence$) {
      this.presence$.unsubscribe()
      this.presence$ = null
    }
  }

  tick = () => {
    this.handleFrame()
    this.tickAnimFrameId = window.requestAnimationFrame(this.tick)
  }

  handleFrame() {
    const winWidth = window.innerWidth
    if (winWidth !== this.state.winWidth) {
      this.handleCustomResize(winWidth)
    }
  }

  handleCustomResize(winWidth) {
    if (this.loginStatusElement) {
      const {showToolSwitcher} = this.state
      // console.log(this.searchElement)
      const mostRightRect = showToolSwitcher
        ? this.loginStatusElement.getBoundingClientRect()
        : this.searchElement.getBoundingClientRect()
      this.setState(state => {
        const nextState = getNextState(state, mostRightRect.left + mostRightRect.width, winWidth)
        // console.log(nextState)
        return nextState
      })
    }
  }

  handleSetLoginStatusElement = element => {
    this.loginStatusElement = element
  }

  handleSetSearchElement = element => {
    this.searchElement = element
  }

  handleUpdatePresence = presence => {
    this.setState({
      presence: presence.filter(
        session => session.identity !== this.props.user.id && session.documentId
      )
    })
  }

  render() {
    const {showLabel, showToolSwitcher, presence} = this.state

    return (
      <NavBar
        {...this.props}
        onSetLoginStatusElement={this.handleSetLoginStatusElement}
        onSetSearchElement={this.handleSetSearchElement}
        showLabel={showLabel}
        showToolSwitcher={showToolSwitcher}
        presence={presence}
      />
    )
  }
}

NavBarContainer.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string
  }).isRequired
}

export default NavBarContainer
