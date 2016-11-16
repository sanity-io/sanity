import React, {PropTypes} from 'react'

export default class RouterProvider extends React.Component {
  static propTypes = {
    onNavigate: PropTypes.func,
    router: PropTypes.object,
    state: PropTypes.object,
    children: PropTypes.node
  }

  navigateUrl = (url, {replace} = {}) => {
    const {onNavigate} = this.props
    onNavigate(url, {replace})
  }

  navigateState = (nextState, {replace} = {}) => {
    this.navigateUrl(this.resolvePathFromState(nextState), {replace})
  }

  resolvePathFromState = state => {
    return this.props.router.encode(state)
  }

  getChildContext() {
    const {state} = this.props
    return {
      __internalRouter: {
        resolvePathFromState: this.resolvePathFromState,
        navigateUrl: this.navigateUrl
      },
      router: {
        navigate: this.navigateState,
        state: state
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
