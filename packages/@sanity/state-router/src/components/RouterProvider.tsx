import React from 'react'
import PropTypes from 'prop-types'
import pubsub from 'nano-pubsub'
import {Router} from '../types'
import {RouterContext} from '../RouterContext'
import {
  InternalRouter,
  NavigateOptions,
  RouterProviderContext,
  RouterState,
  IntentParameters,
} from './types'

type Props = {
  onNavigate: (nextPath: string, options?: NavigateOptions) => void
  router: Router
  state: RouterState
  children: React.ReactNode
}

export default class RouterProvider extends React.Component<Props> {
  public static childContextTypes = {
    __internalRouter: PropTypes.object,
  }

  __internalRouter: InternalRouter
  _state: RouterState

  constructor(props: Props) {
    super(props)
    this._state = props.state
    this.__internalRouter = {
      resolvePathFromState: this.resolvePathFromState,
      resolveIntentLink: this.resolveIntentLink,
      navigateUrl: this.navigateUrl,
      navigate: this.navigateState,
      navigateIntent: this.navigateIntent,
      getState: this.getState,
      channel: pubsub<RouterState>(),
    }
  }

  navigateUrl = (url: string, options: NavigateOptions = {}): void => {
    const {onNavigate} = this.props
    onNavigate(url, options)
  }

  navigateState = (nextState: Record<string, any>, options: NavigateOptions = {}): void => {
    this.navigateUrl(this.resolvePathFromState(nextState), options)
  }

  getState = () => this._state

  resolvePathFromState = (state: Record<string, any>): string => {
    return this.props.router.encode(state)
  }

  navigateIntent = (
    intentName: string,
    params?: IntentParameters,
    options: NavigateOptions = {}
  ): void => {
    this.navigateUrl(this.resolveIntentLink(intentName, params), options)
  }

  resolveIntentLink = (intentName: string, parameters?: IntentParameters): string => {
    const [params, payload] = Array.isArray(parameters) ? parameters : [parameters]
    return this.props.router.encode({intent: intentName, params, payload})
  }

  getChildContext(): RouterProviderContext {
    return {
      __internalRouter: this.__internalRouter,
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (this.props.state !== nextProps.state) {
      this._state = nextProps.state
      setTimeout(this.__internalRouter.channel.publish, 0, nextProps.state)
    }
  }

  render() {
    return (
      <RouterContext.Provider value={this.__internalRouter}>
        {this.props.children}
      </RouterContext.Provider>
    )
  }
}
