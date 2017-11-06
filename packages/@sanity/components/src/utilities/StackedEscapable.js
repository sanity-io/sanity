import React from 'react'
import PropTypes from 'prop-types'
import Escapable from './Escapable'
import Stacked from './Stacked'

export default class StackedEscapable extends React.Component {
  static propTypes = {
    onEscape: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
  }

  handleEscape = (isTopMost, event) => {
    if (isTopMost || event.shiftKey) {
      this.props.onEscape(event)
    }
  }

  render() {
    return (
      <Stacked>
        {isActive => (
          <Escapable onEscape={isActive && this.handleEscape}>
            {this.props.children}
          </Escapable>
        )}
      </Stacked>
    )
  }
}
