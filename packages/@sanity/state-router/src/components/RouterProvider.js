import React, {PropTypes} from 'react'
import {resolvePathFromState, resolveStateFromPath} from '../'

export default class RouterProvider extends React.Component {
  constructor(...args) {
    super(...args)
    this.navigateUrl = this.navigateUrl.bind(this)
    this.navigateState = this.navigateState.bind(this)
    this.resolvePathFromState = this.resolvePathFromState.bind(this)
  }

  navigateUrl(url, {replace} = {}) {
    const {onNavigate} = this.props
    onNavigate(url, {replace})
  }

  navigateState(nextState, {replace} = {}) {
    this.navigateUrl(this.resolvePathFromState(nextState), {replace})
  }

  resolvePathFromState(state) {
    return resolvePathFromState(this.props.router, state)
  }

  getChildContext() {
    const {router, location} = this.props
    return {
      __internalRouter: {
        resolvePathFromState: this.resolvePathFromState,
        navigateUrl: this.navigateUrl
      },
      router: {
        navigate: this.navigateState,
        state: resolveStateFromPath(router, location.pathname)
      }
    }
  }

  render() {
    return this.props.children
  }
}
RouterProvider.childContextTypes = {
  __internalRouter: PropTypes.object,
  router: PropTypes.object
}