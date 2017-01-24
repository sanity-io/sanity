// @flow
import React, {PropTypes, Element} from 'react'
import isEmpty from '../utils/isEmpty'

import type {RouterProviderContext, NavigateOptions, InternalRouter, ContextRouter} from './types'

function addScope(routerState : Object, scope : string, scopedState : Object) {
  return scopedState && {
    ...routerState,
    [scope]: scopedState
  }
}
export default class RouteScope extends React.Component {
  props: {
    scope: string,
    children: Element<*>
  }
  context: RouterProviderContext

  static childContextTypes = RouteScope.contextTypes = {
    __internalRouter: PropTypes.object,
    router: PropTypes.object
  }
  getChildContext() : RouterProviderContext {
    const {scope} = this.props
    const internalRouter: InternalRouter = this.context.__internalRouter
    const router: ContextRouter = this.context.router

    return {
      __internalRouter: {
        resolvePathFromState: this.resolvePathFromState,
        resolveIntentLink: internalRouter.resolveIntentLink,
        navigateUrl: internalRouter.navigateUrl
      },
      router: {
        navigate: this.navigate,
        state: router.state[scope]
      }
    }
  }

  resolvePathFromState = (nextState: Object): string => {
    const context = this.context
    const scope = this.props.scope

    const nextStateScoped : Object = isEmpty(nextState)
      ? {}
      : addScope(context.router.state, scope, nextState)

    return context.__internalRouter.resolvePathFromState(nextStateScoped)
  }

  navigate = (nextState: Object, options?: NavigateOptions) : void => {
    const scope = this.props.scope
    const router = this.context.router
    router.navigate(addScope(router.state, scope, nextState), options)
  }

  render() {
    return this.props.children
  }
}
