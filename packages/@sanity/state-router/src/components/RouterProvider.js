// @flow
import React, {PropTypes, Element} from 'react'
import type {Router} from '../types'
import type {RouterProviderContext, NavigateOptions, InternalRouter} from './types'
import {valueChannel} from './valueChannel'
import assignLazyGetter from './assignLazyGetter'

type Props = {
  onNavigate: (nextPath: string) => void,
  router: Router,
  state: Object,
  children?: Element<*>
}

export default class RouterProvider extends React.Component {
  props: Props

  static childContextTypes = {
    __internalRouter: PropTypes.object,
    router: PropTypes.object
  }

  __internalRouter: InternalRouter

  constructor(props : Props) {
    super()
    this.__internalRouter = {
      resolvePathFromState: this.resolvePathFromState,
      resolveIntentLink: this.resolveIntentLink,
      navigateUrl: this.navigateUrl,
      navigate: this.navigateState,
      channel: valueChannel(props.state)
    }
  }
  navigateUrl = (url : string, options : NavigateOptions = {}) : void => {
    const {onNavigate} = this.props
    onNavigate(url, options)
  }

  navigateState = (nextState : Object, options : NavigateOptions = {}) : void => {
    this.navigateUrl(this.resolvePathFromState(nextState), options)
  }

  resolvePathFromState = (state : Object) : string => {
    return this.props.router.encode(state)
  }

  resolveIntentLink = (intent : string, params? : Object) : string => {
    return this.props.router.encode({intent, params})
  }

  getChildContext() : RouterProviderContext {
    const {state} = this.props
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
        navigate: this.navigateState,
        state: state
      }
    })
  }

  componentWillReceiveProps(nextProps : Props) {
    if (this.props.state !== nextProps.state) {
      this.__internalRouter.channel.publish(nextProps.state)
    }
  }

  render() {
    return this.props.children
  }
}
