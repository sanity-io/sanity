// @flow
import React, {PropTypes, Element} from 'react'
import isEmpty from '../utils/isEmpty'
import assignLazyGetter from './assignLazyGetter'

import type {RouterProviderContext, NavigateOptions, InternalRouter} from './types'

function addScope(routerState : Object, scope : string, scopedState : Object) {
  return scopedState && {
    ...routerState,
    [scope]: scopedState
  }
}

type Props = {
  scope: string,
  children: Element<*>
}

export default class RouteScope extends React.Component {
  props: Props
  __internalRouter: InternalRouter

  static childContextTypes = RouteScope.contextTypes = {
    __internalRouter: PropTypes.object,
    router: PropTypes.object
  }

  constructor(props : Props, context : RouterProviderContext) {
    super()
    const parentInternalRouter = context.__internalRouter

    this.__internalRouter = {
      ...parentInternalRouter,
      resolvePathFromState: this.resolvePathFromState,
      navigate: this.navigate,
      getState: this.getScopedState
    }
  }

  getChildContext() : RouterProviderContext {

    let warn = () => {
      // eslint-disable-next-line no-console
      console.error(new Error(
        'Reading "router" from context is deprecated. Use the WithRouter enhancer/HOC, or the <WithRouter> component instead.'
      ))
      warn = () => {}
    }
    const deprecatedChildRouter = {}
    assignLazyGetter(deprecatedChildRouter, 'state', () => {
      warn()
      return this.getScopedState()
    })
    assignLazyGetter(deprecatedChildRouter, 'navigate', () => {
      warn()
      this.getScopedState()
    })

    // todo: just return childContext with __internalRouter, remove the deprecatedChidlRouter eventually
    const childContext = {
      __internalRouter: this.__internalRouter,
      router: deprecatedChildRouter
    }

    return childContext
  }

  getScopedState = () => {
    const {scope} = this.props
    const parentInternalRouter = this.context.__internalRouter
    return parentInternalRouter.getState()[scope]
  }

  resolvePathFromState = (nextState: Object): string => {
    const parentInternalRouter = this.context.__internalRouter
    const scope = this.props.scope

    const nextStateScoped : Object = isEmpty(nextState)
      ? {}
      : addScope(parentInternalRouter.getState(), scope, nextState)

    return parentInternalRouter.resolvePathFromState(nextStateScoped)
  }

  navigate = (nextState: Object, options?: NavigateOptions) : void => {
    const parentInternalRouter = this.context.__internalRouter
    const nextScopedState = addScope(parentInternalRouter.getState(), this.props.scope, nextState)
    parentInternalRouter.navigate(nextScopedState, options)
  }

  render() {
    return this.props.children
  }
}
