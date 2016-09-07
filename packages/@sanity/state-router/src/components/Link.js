import React, {PropTypes} from 'react'
import omit from 'lodash/omit'

function isLeftClickEvent(event) {
  return event.button === 0
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

export default class Link extends React.Component {
  constructor() {
    super()
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(e) {

    const {onClick, href, target, replace} = this.props

    if (onClick) {
      onClick(e)
    }

    if (isModifiedEvent(e) || !isLeftClickEvent(e)) {
      return
    }

    // If target prop is set (e.g. to "_blank") let browser handle link.
    if (target) {
      return
    }

    e.preventDefault()
    this.context.__internalRouter.navigateUrl(href, {replace})
  }
  render() {

    return <a {...omit(this.props, 'replace')} onClick={this.handleClick} />
  }
}

Link.defaultProps = {
  replace: false,
}
Link.propTypes = {
  replace: PropTypes.bool
}
Link.contextTypes = {
  __internalRouter: PropTypes.object
}