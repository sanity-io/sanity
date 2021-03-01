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

interface LinkProps {
  replace?: boolean
}

export default class Link extends React.PureComponent<
  LinkProps & Omit<React.HTMLProps<HTMLAnchorElement>, 'ref'>
> {
  context: RouterProviderContext | null = null
  _element: HTMLAnchorElement | null = null

  static defaultProps = {
    replace: false,
  }

  static contextTypes = {
    __internalRouter: internalRouterContextTypeCheck,
  }

  private handleClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    if (!this.context) throw new Error('Link: missing context value')

    if (!this.context.__internalRouter) {
      return
    }

    if (event.isDefaultPrevented()) {
      return
    }

    const {onClick, href, target, replace} = this.props

    if (!href) return

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
