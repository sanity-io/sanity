import React from 'react'
import Link from './Link'
import {RouterProviderContext, IntentParameters} from './types'
import internalRouterContextTypeCheck from './internalRouterContextTypeCheck'

interface IntentLinkProps {
  intent: string
  params?: IntentParameters
}

export default class IntentLink extends React.PureComponent<
  IntentLinkProps & Omit<React.HTMLProps<HTMLAnchorElement>, 'ref'>
> {
  context: RouterProviderContext | null = null

  static contextTypes = {
    __internalRouter: internalRouterContextTypeCheck,
  }

  _element: Link | null = null

  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  setElement = (element: Link | null) => {
    if (element) {
      this._element = element
    }
  }

  resolveIntentLink(intent: string, params?: IntentParameters) {
    if (!this.context) throw new Error('IntentLink: missing context value')

    if (!this.context.__internalRouter) {
      return `javascript://intent@${JSON.stringify({intent, params})}`
    }

    return this.context.__internalRouter.resolveIntentLink(intent, params)
  }

  render() {
    const {intent, params, ...restProps} = this.props

    return (
      <Link {...restProps} href={this.resolveIntentLink(intent, params)} ref={this.setElement} />
    )
  }
}
