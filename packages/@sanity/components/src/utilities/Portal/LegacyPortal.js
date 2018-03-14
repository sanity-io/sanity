// This file is a fallback for a consumer who is not yet on React 16
// as createPortal was introduced in React 16

// based on tajo/react-portal, but removes unused functionality and includes a bugfix

import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'

export class LegacyPortal extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  }
  componentDidMount() {
    this.renderPortal()
  }

  componentDidUpdate(props) {
    this.renderPortal()
  }

  componentWillUnmount() {
    if (this.node) {
      // Unmount the children rendered in custom node
      ReactDOM.unmountComponentAtNode(this.node)
      document.body.removeChild(this.node)
      this.node = null
      this.portal = null
    }
  }

  renderPortal() {
    if (!this.node) {
      this.node = document.createElement('div')
      document.body.appendChild(this.node)
    }

    let children = this.props.children
    // https://gist.github.com/jimfb/d99e0678e9da715ccf6454961ef04d1b
    if (typeof this.props.children.type === 'function') {
      children = React.cloneElement(this.props.children)
    }

    this.portal = ReactDOM.unstable_renderSubtreeIntoContainer(this, children, this.node)
  }

  render() {
    return null
  }
}
