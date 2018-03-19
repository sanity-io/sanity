// @flow
import React from 'react'
import {omit} from 'lodash'
import type {RouterProviderContext} from './types'
import internalRouterContextTypeCheck from './internalRouterContextTypeCheck'

function isLeftClickEvent(event: SyntheticMouseEvent<*>) {
  return event.button === 0
}

function isModifiedEvent(event: SyntheticMouseEvent<*>) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

export default class Link extends React.PureComponent<*, *> {
  props: {
    replace?: boolean,
    onClick?: (event: SyntheticMouseEvent<*>) => void,
    href: string,
    target?: string
  }

  context: RouterProviderContext
  _element: HTMLAnchorElement

  static defaultProps = {
    replace: false
  }

  static contextTypes = {
    __internalRouter: internalRouterContextTypeCheck
  }

  handleClick = (event: SyntheticMouseEvent<*>): void => {
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

  setElement = (element: ?HTMLAnchorElement) => {
    if (element) {
      this._element = element
    }
  }

  render() {
    return <a {...omit(this.props, 'replace')} onClick={this.handleClick} ref={this.setElement} />
  }
}
