import PropTypes from 'prop-types'
// @flow
import React, { Element } from 'react';
import type {Router} from '../types'
import type {RouterProviderContext, NavigateOptions, InternalRouter, RouterState} from './types'
import pubsub from 'nano-pubsub'

type Props = {
  onNavigate: (nextPath: string) => void,
  router: Router,
  state: RouterState,
  children?: Element<*>
}

export default class RouterProvider extends React.Component {
  props: Props

  static childContextTypes = {
    __internalRouter: PropTypes.object
  }

  __internalRouter: InternalRouter
  _state: RouterState

  constructor(props : Props) {
    super()
    this._state = props.state
    this.__internalRouter = {
      resolvePathFromState: this.resolvePathFromState,
      resolveIntentLink: this.resolveIntentLink,
      navigateUrl: this.navigateUrl,
      navigate: this.navigateState,
      getState: this.getState,
      channel: pubsub()
    }
  }

  navigateUrl = (url : string, options : NavigateOptions = {}) : void => {
    const {onNavigate} = this.props
    onNavigate(url, options)
  }

  navigateState = (nextState : Object, options : NavigateOptions = {}) : void => {
    this.navigateUrl(this.resolvePathFromState(nextState), options)
  }

  getState = () => this._state

  resolvePathFromState = (state : Object) : string => {
    return this.props.router.encode(state)
  }

  resolveIntentLink = (intent : string, params? : Object) : string => {
    return this.props.router.encode({intent, params})
  }

  getChildContext() : RouterProviderContext {
    return {
      __internalRouter: this.__internalRouter
    }
  }

  componentWillReceiveProps(nextProps : Props) {
    if (this.props.state !== nextProps.state) {
      this._state = nextProps.state
      this.__internalRouter.channel.publish(nextProps.state)
    }
  }

  render() {
    return this.props.children
  }
}
