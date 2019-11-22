import PropTypes from 'prop-types'
import React from 'react'
import isEmpty from '../utils/isEmpty'

import {InternalRouter, NavigateOptions, RouterProviderContext} from './types'
import {RouterContext} from '../RouterContext'

function addScope(routerState: Object, scope: string, scopedState: Object) {
  return (
    scopedState && {
      ...routerState,
      [scope]: scopedState
    }
  )
}

type Props = {
  scope: string
  children: React.ReactNode
}

export default class RouteScope extends React.Component<Props> {
  context: RouterProviderContext
  __internalRouter: InternalRouter

  static childContextTypes = {
    __internalRouter: PropTypes.object
  }

  static contextTypes = {
    __internalRouter: PropTypes.object
  }

  constructor(props: Props, context: RouterProviderContext) {
    super(props)
    const parentInternalRouter = context.__internalRouter

    this.__internalRouter = {
      ...parentInternalRouter,
      resolvePathFromState: this.resolvePathFromState,
      navigate: this.navigate,
      getState: this.getScopedState
    }
  }

  public getChildContext(): RouterProviderContext {
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
    return (
      <RouterContext.Provider value={this.__internalRouter}>
        {this.props.children}
      </RouterContext.Provider>
    )
  }
}
