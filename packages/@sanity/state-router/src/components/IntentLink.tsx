import React from 'react'
import Link from './Link'
import {RouterProviderContext, IntentParameters} from './types'
import internalRouterContextTypeCheck from './internalRouterContextTypeCheck'

type Props = {
  intent: string
  params?: IntentParameters
  children: React.ReactNode
  className?: string
}

export default class IntentLink extends React.PureComponent<Props> {
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

  setElement = (element: Link | null) => {
    if (element) {
      this._element = element
    }
  }

  resolveIntentLink(intent: string, params?: IntentParameters) {
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
