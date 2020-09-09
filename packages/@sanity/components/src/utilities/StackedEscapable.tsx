import React from 'react'
import Escapable from './Escapable'
import Stacked from './Stacked'

interface StackedExampleProps {
  onEscape: (event: KeyboardEvent) => void
  children: React.ReactNode
}

export default class StackedEscapable extends React.Component<StackedExampleProps> {
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
