import React from 'react'

interface EscapableProps {
  onEscape?: (event: KeyboardEvent) => void
  children?: React.ReactNode
}

type Listener<E = Event> = (event: E) => void

function createListener<E extends Event>(eventName: 'keydown') {
  let listeners: Listener<E>[] = []
  return listen

  function notify(event: E) {
    listeners.forEach(l => l(event))
  }

  function unlisten(listener: Listener<E>) {
    listeners = listeners.filter(l => l !== listener)

    if (listeners.length === 0) {
      document.removeEventListener(eventName, notify as Listener)
    }
  }

  function listen(listener: Listener<E>) {
    if (listeners.length === 0) {
      document.addEventListener(eventName, notify as Listener)
    }

    listeners.push(listener)

    return () => unlisten(listener)
  }
}

const onKeypress = createListener<KeyboardEvent>('keydown')

// @todo: refactor to functional component
export default class Escapable extends React.Component<EscapableProps> {
  removeListener?: () => void

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    this.removeListener = onKeypress(this.handleKeyPress)
  }

  componentWillUnmount() {
    if (this.removeListener) this.removeListener()
  }

  handleKeyPress = (event: KeyboardEvent) => {
    if (this.props.onEscape && event.key === 'Escape') {
      this.props.onEscape(event)
    }
  }

  render() {
    return this.props.children || null
  }
}
