// @flow
import React from 'react'
import type {Node} from 'react'
import Link from './Link'
import type {RouterProviderContext} from './types'
import internalRouterContextTypeCheck from './internalRouterContextTypeCheck'

export default class IntentLink extends React.PureComponent<*, *> {
  props: {
    intent: string,
    params?: Object,
    children: Node,
    className: string
  }

  context: RouterProviderContext

  static contextTypes = {
    __internalRouter: internalRouterContextTypeCheck
  }

  _element: Link

  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  setElement = (element: ?Link) => {
    if (element) {
      this._element = element
    }
  }

  resolveIntentLink(intent: string, params?: Object) {
    if (!this.context.__internalRouter) {
      return `javascript://intent@${JSON.stringify({intent, params})}`
    }
    return this.context.__internalRouter.resolveIntentLink(intent, params)
  }

  render() {
    const {intent, params, ...rest} = this.props

    return <Link href={this.resolveIntentLink(intent, params)} {...rest} ref={this.setElement} />
  }
}
