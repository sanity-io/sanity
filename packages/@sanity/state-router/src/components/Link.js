// @flow
import React, {PropTypes} from 'react'
import omit from 'lodash/omit'
import type {RouterProviderContext} from './types'

function isLeftClickEvent(event : SyntheticMouseEvent) {
  return event.button === 0
}

function isModifiedEvent(event : SyntheticMouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

export default class Link extends React.PureComponent {
  props: {
    replace?: boolean,
    onClick?: (event : SyntheticMouseEvent) => void,
    href: string,
    target?: string
  }

  context: RouterProviderContext

  static defaultProps = {
    replace: false,
  }

  static contextTypes = {
    __internalRouter: PropTypes.object
  }

  handleClick = (event : SyntheticMouseEvent) : void => {

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
  render() {
    return <a {...omit(this.props, 'replace')} onClick={this.handleClick} />
  }
}
