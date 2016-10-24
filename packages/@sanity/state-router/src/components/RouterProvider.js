import React, {PropTypes} from 'react'
import {resolvePathFromState, resolveStateFromPath} from '../'

let didWarn = false
function validateProps(props) {
  if (didWarn) {
    return
  }
  if (props.state && props.location) {
    // eslint-disable-next-line no-console
    console.error(new Error(
      "[Warning] You passed both state and location to RouterProvider. If you pass 'state' you don't need to pass 'location' and vice versa"
    ))
    didWarn = true
  }
}

export default class RouterProvider extends React.Component {
  constructor(props, ...rest) {
    super(props, ...rest)
    this.navigateUrl = this.navigateUrl.bind(this)
    this.navigateState = this.navigateState.bind(this)
    this.resolvePathFromState = this.resolvePathFromState.bind(this)
    validateProps(props)
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

  componentWillReceiveProps(nextProps) {
    validateProps(nextProps)
  }

  getChildContext() {
    const {router, location, state} = this.props
    return {
      __internalRouter: {
        resolvePathFromState: this.resolvePathFromState,
        navigateUrl: this.navigateUrl
      },
      router: {
        navigate: this.navigateState,
        state: state || resolveStateFromPath(router, location.pathname)
      }
    }
  }

  render() {
    return this.props.children
  }
}
RouterProvider.propTypes = {
  state: PropTypes.object,
  children: PropTypes.node,
  router: PropTypes.object,
  onNavigate: PropTypes.func,
  location: PropTypes.shape({
    pathname: PropTypes.string
  })
}
RouterProvider.childContextTypes = {
  __internalRouter: PropTypes.object,
  router: PropTypes.object
}
