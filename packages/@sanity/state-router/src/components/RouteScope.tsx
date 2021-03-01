import PropTypes from 'prop-types'
import React from 'react'
import isEmpty from '../utils/isEmpty'

import {RouterContext} from '../RouterContext'
import {InternalRouter, NavigateOptions, RouterProviderContext} from './types'

function addScope(
  routerState: Record<string, any>,
  scope: string,
  scopedState: Record<string, any>
) {
  return (
    scopedState && {
      ...routerState,
      [scope]: scopedState,
    }
  )
}

type Props = {
  scope: string
  children: React.ReactNode
}

export default class RouteScope extends React.Component<Props> {
  context: RouterProviderContext | null = null
  __internalRouter: InternalRouter

  static childContextTypes = {
    __internalRouter: PropTypes.object,
  }

  static contextTypes = {
    __internalRouter: PropTypes.object,
  }

  constructor(props: Props, context: RouterProviderContext) {
    super(props)
    const parentInternalRouter = context.__internalRouter

    this.__internalRouter = {
      ...parentInternalRouter,
      resolvePathFromState: this.resolvePathFromState,
      navigate: this.navigate,
      getState: this.getScopedState,
    }
  }

  public getChildContext(): RouterProviderContext {
    return {
      __internalRouter: this.__internalRouter,
    }
  }

  getScopedState = () => {
    const {scope} = this.props
    if (!this.context) throw new Error('RouteScope: missing context value')
    const parentInternalRouter = this.context.__internalRouter
    return parentInternalRouter.getState()[scope]
  }

  resolvePathFromState = (nextState: Record<string, any>): string => {
    if (!this.context) throw new Error('RouteScope: missing context value')

    const parentInternalRouter = this.context.__internalRouter
    const scope = this.props.scope

    const nextStateScoped: Record<string, any> = isEmpty(nextState)
      ? {}
      : addScope(parentInternalRouter.getState(), scope, nextState)

    return parentInternalRouter.resolvePathFromState(nextStateScoped)
  }

  navigate = (nextState: Record<string, any>, options?: NavigateOptions): void => {
    if (!this.context) throw new Error('RouteScope: missing context value')
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
