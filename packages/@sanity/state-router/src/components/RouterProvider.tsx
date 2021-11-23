import {isEqual} from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import {unstable_batchedUpdates as batchedUpdates} from 'react-dom'
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

type RouterProviderProps = {
  onNavigate: (nextPath: string, options?: NavigateOptions) => void
  router: Router
  state: RouterState
  children: React.ReactNode
}

export default class RouterProvider extends React.Component<RouterProviderProps> {
  public static childContextTypes = {
    __internalRouter: PropTypes.object,
  }

  __internalRouter: InternalRouter
  _state: RouterState

  constructor(props: RouterProviderProps) {
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

  navigateState = (nextState: Record<string, unknown>, options: NavigateOptions = {}): void => {
    this.navigateUrl(this.resolvePathFromState(nextState), options)
  }

  getState = () => this._state

  resolvePathFromState = (state: Record<string, unknown>): string => {
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

  componentDidUpdate(prevProps) {
    const {state: currentState} = this.props
    const {state: prevState} = prevProps

    if (!isEqual(currentState, prevState)) {
      this._state = currentState

      setTimeout(() => {
        batchedUpdates(() => {
          this.__internalRouter.channel.publish(currentState)
        })
      }, 0)
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
