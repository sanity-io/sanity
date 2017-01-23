// @flow
import React, {PropTypes, Element} from 'react'
import type {Router} from '../types'
import type {RouterProviderContext, NavigateOptions} from './types'

type Props = {
  onNavigate: () => void,
  router: Router,
  state: Object,
  children: Element<*>
}

export default class RouterProvider extends React.Component {
  props: Props

  static childContextTypes = {
    __internalRouter: PropTypes.object,
    router: PropTypes.object
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

  resolveIntentLink = (intent : string, params : Object) : string => {
    return this.props.router.encode({intent, params})
  }

  getChildContext() : RouterProviderContext {
    const {state} = this.props
    return {
      __internalRouter: {
        resolvePathFromState: this.resolvePathFromState,
        resolveIntentLink: this.resolveIntentLink,
        navigateUrl: this.navigateUrl
      },
      router: {
        navigate: this.navigateState,
        state: state
      }
    }
  }

  render() {
    return this.props.children
  }
}
