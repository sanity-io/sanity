import React from 'react'
import PropTypes from 'prop-types'
import {createPortal} from 'react-dom'

const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
)

export class ModernPortal extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  }
  componentWillUnmount() {
    if (this.node) {
      document.body.removeChild(this.node)
    }
    this.node = null
  }

  render() {
    if (!canUseDOM) {
      return null
    }
    if (!this.node) {
      this.node = document.createElement('div')
      document.body.appendChild(this.node)
    }
    return createPortal(this.props.children, this.node)
  }
}
