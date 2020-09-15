import React from 'react'
import Escapable from './Escapable'
import Stacked from './Stacked'

interface StackedExampleProps {
  onEscape: (event: KeyboardEvent) => void
  children: React.ReactNode
}

function StackedEscapable(props: StackedExampleProps) {
  const {children, onEscape} = props

  return (
    <Stacked>
      {isActive => (
        // eslint-disable-next-line react/jsx-no-bind
        <Escapable onEscape={event => (isActive || event.shiftKey) && onEscape(event)}>
          {children}
        </Escapable>
      )}
    </Stacked>
  )
}

export default StackedEscapable
