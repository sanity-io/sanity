// @flow
import React, {PropTypes, Element} from 'react'
import isEmpty from '../utils/isEmpty'
import {map} from './valueChannel'
import assignLazyGetter from './assignLazyGetter'

import type {RouterProviderContext, NavigateOptions, InternalRouter, ContextRouter} from './types'

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
  context: RouterProviderContext
  __internalRouter: InternalRouter

  static childContextTypes = RouteScope.contextTypes = {
    __internalRouter: PropTypes.object,
    router: PropTypes.object
  }

  constructor(props : Props, context : RouterProviderContext) {
    super()
    const parentInternalRouter = context.__internalRouter
    this.__internalRouter = {
      resolvePathFromState: this.resolvePathFromState,
      navigate: this.navigate,
      resolveIntentLink: parentInternalRouter.resolveIntentLink,
      navigateUrl: parentInternalRouter.navigateUrl,
      channel: map(parentInternalRouter.channel, state => state[props.scope])
    }
  }

  getChildContext() : RouterProviderContext {
    const {scope} = this.props

    const router: ContextRouter = this.context.router

    const childContext = {
      __internalRouter: this.__internalRouter
    }

    // todo: just return childContext, remove this eventually
    return assignLazyGetter(childContext, 'router', () => {
      // eslint-disable-next-line no-console
      console.error(new Error(
        'Reading "router" from context is deprecated. Use the WithRouter enhancer/HOC, or the <WithRouter> component instead.'
      ))
      return {
        navigate: this.navigate,
        state: router.state[scope]
      }
    })
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
