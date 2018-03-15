// @flow
import React from 'react'
import PropTypes from 'prop-types'
import pubsub from 'nano-pubsub'
import type {Node} from 'react'
import type {Router} from '../types'
import type {RouterProviderContext, NavigateOptions, InternalRouter, RouterState} from './types'

type Props = {
  onNavigate: (nextPath: string, options?: NavigateOptions) => void,
  router: Router,
  state: RouterState,
  children: Node
}

export default class RouterProvider extends React.Component<*, *> {
  props: Props

  static childContextTypes = {
    __internalRouter: PropTypes.object
  }

  __internalRouter: InternalRouter
  _state: RouterState

  constructor(props: Props) {
    super()
    this._state = props.state
    this.__internalRouter = {
      resolvePathFromState: this.resolvePathFromState,
      resolveIntentLink: this.resolveIntentLink,
      navigateUrl: this.navigateUrl,
      navigate: this.navigateState,
      navigateIntent: this.navigateIntent,
      getState: this.getState,
      channel: pubsub()
    }
  }

  navigateUrl = (url: string, options: NavigateOptions = {}): void => {
    const {onNavigate} = this.props
    onNavigate(url, options)
  }

  navigateState = (nextState: Object, options: NavigateOptions = {}): void => {
    this.navigateUrl(this.resolvePathFromState(nextState), options)
  }

  navigateIntent = (intentName: string, params?: Object, options?: NavigateOptions = {}): void => {
    this.navigateUrl(this.resolveIntentLink(intentName, params), options)
  }

  getState = () => this._state

  resolvePathFromState = (state: Object): string => {
    return this.props.router.encode(state)
  }

  resolveIntentLink = (intentName: string, params?: Object): string => {
    return this.props.router.encode({intent: intentName, params})
  }

  getChildContext(): RouterProviderContext {
    return {
      __internalRouter: this.__internalRouter
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.state !== nextProps.state) {
      this._state = nextProps.state
      this.__internalRouter.channel.publish(nextProps.state)
    }
  }

  render() {
    return this.props.children
  }
}
