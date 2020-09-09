import React from 'react'
import PropTypes from 'prop-types'
import Escapable from './Escapable'
import Stacked from './Stacked'

export default class StackedEscapable extends React.Component {
  static propTypes = {
    onEscape: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
  }

  render() {
    const {onEscape} = this.props
    return (
      <Stacked>
        {isActive => (
          <Escapable onEscape={event => (isActive || event.shiftKey) && onEscape(event)}>
            {this.props.children}
          </Escapable>
        )}
      </Stacked>
    )
  }
}
