import React, {MouseEvent} from 'react'
import {omit} from 'lodash'
import {RouterProviderContext} from './types'
import internalRouterContextTypeCheck from './internalRouterContextTypeCheck'

function isLeftClickEvent(event: MouseEvent) {
  return event.button === 0
}

function isModifiedEvent(event: MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

type Props = {
  replace?: boolean
  onClick?: (event: MouseEvent) => void
  href: string
  target?: string
  children?: React.ReactNode
}

export default class Link extends React.PureComponent<Props> {
  context: RouterProviderContext
  _element: HTMLAnchorElement

  static defaultProps = {
    replace: false
  }

  static contextTypes = {
    __internalRouter: internalRouterContextTypeCheck
  }

  private handleClick = (event: MouseEvent): void => {
    if (!this.context.__internalRouter) {
      return
    }

    if (event.isDefaultPrevented()) {
      return
    }

    const {onClick, href, target, replace} = this.props

    if (onClick) {
      onClick(event)
    }

    if (isModifiedEvent(event) || !isLeftClickEvent(event)) {
      return
    }

    // If target prop is set (e.g. to "_blank") let browser handle link.
    if (target) {
      return
    }

    event.preventDefault()

    this.context.__internalRouter.navigateUrl(href, {replace})
  }

  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  setElement = (element: HTMLAnchorElement | null) => {
    if (element) {
      this._element = element
    }
  }

  render() {
    return <a {...omit(this.props, 'replace')} onClick={this.handleClick} ref={this.setElement} />
  }
}
