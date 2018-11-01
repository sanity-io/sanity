import React from 'react'
import NavBar from './NavBar'

/* eslint-disable complexity */
/* eslint-disable max-depth */
/* eslint-disable no-lonely-if */
function getNextState(state, mostRight, viewportWidth) {
  const {showLabel, showLabelMinWidth, showToolSwitcher, showToolSwitcherMinWidth} = state
  const mostRightIsVisible = mostRight && mostRight <= viewportWidth
  const nextState = {}

  let didChange = false

  if (mostRightIsVisible) {
    // most-right element is within viewport
    if (showLabel) {
      if (showLabelMinWidth === -1 || viewportWidth < showLabelMinWidth) {
        nextState.showLabelMinWidth = viewportWidth
        didChange = true
      }
    } else if (showLabelMinWidth < viewportWidth) {
      nextState.showLabel = true
      didChange = true
    }

    if (showToolSwitcher) {
      if (showToolSwitcherMinWidth === -1 || viewportWidth < showToolSwitcherMinWidth) {
        nextState.showToolSwitcherMinWidth = viewportWidth
        didChange = true
      }
    } else if (showToolSwitcherMinWidth < viewportWidth) {
      nextState.showToolSwitcher = true
      didChange = true
    }
  } else {
    // most-right element is NOT within viewport
    if (showLabel) {
      nextState.showLabel = false
      didChange = true
    } else if (showToolSwitcher) {
      nextState.showToolSwitcher = false
      didChange = true
    }
  }

  return didChange ? nextState : null
}
/* eslint-enable complexity */
/* eslint-enable max-depth */
/* eslint-enable no-lonely-if */

class NavBarContainer extends React.PureComponent {
  state = {
    showLabel: false,
    showLabelMinWidth: -1,
    showToolSwitcher: false,
    showToolSwitcherMinWidth: -1
  }

  loginStatusElement = null

  componentDidMount() {
    // Setup IntersectionObserver to check whether elements within the NavBar
    // exits the viewport at any time.
    window.addEventListener('resize', this.handleWindowResize)
    this.handleWindowResize()
  }

  /* eslint-disable complexity */
  componentDidUpdate(prevProps, prevState) {
    const {showLabel, showLabelMinWidth, showToolSwitcher, showToolSwitcherMinWidth} = this.state
    const didShowLabel = showLabelMinWidth === -1 && !prevState.showLabel && showLabel
    const didShowToolSwitcher =
      showToolSwitcherMinWidth === -1 && !prevState.showToolSwitcher && showToolSwitcher
    const didHideLabel = showToolSwitcherMinWidth === -1 && prevState.showLabel && !showLabel

    if (didShowLabel || didShowToolSwitcher || didHideLabel) {
      this.handleWindowResize()
    }
  }
  /* eslint-enable complexity */

  componentWillUnmount() {
    if (this.io) {
      this.io.disconnect()
      this.io = null
    }
  }

  handleWindowResize = () => {
    if (this.loginStatusElement) {
      const rect = this.loginStatusElement.getBoundingClientRect()
      const nextState = getNextState(this.state, rect.left + rect.width, window.innerWidth)

      if (nextState) {
        // console.log(nextState)
        this.setState(nextState)
      }
    }
  }

  handleSetLoginStatusElement = element => {
    this.loginStatusElement = element
  }

  render() {
    const {showLabel, showToolSwitcher} = this.state

    return (
      <NavBar
        {...this.props}
        onSetLoginStatusElement={this.handleSetLoginStatusElement}
        showLabel={showLabel}
        showToolSwitcher={showToolSwitcher}
      />
    )
  }
}

export default NavBarContainer
