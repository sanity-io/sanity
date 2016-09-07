import React, {PropTypes} from 'react'

export default class RouteScope extends React.Component {
  getChildContext() {
    const {scope} = this.props
    const {router, __internalRouter} = this.context
    return {
      __internalRouter: {
        resolvePathFromState: nextState => {
          return __internalRouter.resolvePathFromState(getUnscopedState(nextState))
        },
        navigateUrl: __internalRouter.navigateUrl
      },
      router: {
        navigate: (nextState, options)=> {
          router.navigate(getUnscopedState(nextState), options)
        },
        state: router.state[scope] || {}
      }
    }

    function getUnscopedState(nextState) {
      return Object.assign({}, router.state, {[scope]: nextState})
    }

  }
  render() {
    return this.props.children
  }
}

RouteScope.propTypes = {
  scope: PropTypes.string
}

RouteScope.childContextTypes = RouteScope.contextTypes = {
  __internalRouter: PropTypes.object,
  router: PropTypes.object
}