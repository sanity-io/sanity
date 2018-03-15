// @flow
import PropTypes from 'prop-types'
import React from 'react'
import isEmpty from '../utils/isEmpty'

import type {Node} from 'react'
import type {RouterProviderContext, NavigateOptions, InternalRouter} from './types'

function addScope(routerState: Object, scope: string, scopedState: Object) {
  return (
    scopedState && {
      ...routerState,
      [scope]: scopedState
    }
  )
}

type Props = {
  scope: string,
  children: Node
}

export default class RouteScope extends React.Component<*, *> {
  props: Props
  __internalRouter: InternalRouter

  static childContextTypes = (RouteScope.contextTypes = {
    __internalRouter: PropTypes.object
  })

  constructor(props: Props, context: RouterProviderContext) {
    super()
    const parentInternalRouter = context.__internalRouter

    this.__internalRouter = {
      ...parentInternalRouter,
      resolvePathFromState: this.resolvePathFromState,
      navigate: this.navigate,
      getState: this.getScopedState
    }
  }

  getChildContext(): RouterProviderContext {
    return {
      __internalRouter: this.__internalRouter
    }
  }

  getScopedState = () => {
    const {scope} = this.props
    const parentInternalRouter = this.context.__internalRouter
    return parentInternalRouter.getState()[scope]
  }

  resolvePathFromState = (nextState: Object): string => {
    const parentInternalRouter = this.context.__internalRouter
    const scope = this.props.scope

    const nextStateScoped: Object = isEmpty(nextState)
      ? {}
      : addScope(parentInternalRouter.getState(), scope, nextState)

    return parentInternalRouter.resolvePathFromState(nextStateScoped)
  }

  navigate = (nextState: Object, options?: NavigateOptions): void => {
    const parentInternalRouter = this.context.__internalRouter
    const nextScopedState = addScope(parentInternalRouter.getState(), this.props.scope, nextState)
    parentInternalRouter.navigate(nextScopedState, options)
  }

  render() {
    return this.props.children
  }
}
