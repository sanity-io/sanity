import React, {PropTypes} from 'react'

export default class RouteScope extends React.Component {
  static propTypes = {
    scope: PropTypes.string,
    children: PropTypes.node
  }

  static childContextTypes = RouteScope.contextTypes = {
    __internalRouter: PropTypes.object,
    router: PropTypes.object
  }

  getChildContext() {
    const {scope} = this.props
    const {router, __internalRouter} = this.context
    return {
      __internalRouter: {
        resolvePathFromState: nextState => {
          const empty = Object.keys(nextState).length === 0
          return __internalRouter.resolvePathFromState(empty ? {} : addScope(nextState))
        },
        navigateUrl: __internalRouter.navigateUrl
      },
      router: {
        navigate: (nextState, options) => {
          router.navigate(addScope(nextState), options)
        },
        state: router.state[scope]
      }
    }

    function addScope(nextState) {
      return nextState && Object.assign({}, router.state, {[scope]: nextState})
    }

  }
  render() {
    return this.props.children
  }
}
