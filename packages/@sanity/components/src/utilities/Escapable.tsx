import React from 'react'
import PropTypes from 'prop-types'

function createListener(eventName) {
  let listeners = []
  return listen

  function notify(event) {
    listeners.forEach(l => l(event))
  }

  function unlisten(listener) {
    listeners = listeners.filter(l => l !== listener)
    if (listeners.length === 0) {
      document.removeEventListener(eventName, notify)
    }
  }

  function listen(listener) {
    if (listeners.length === 0) {
      document.addEventListener(eventName, notify)
    }
    listeners.push(listener)
    return () => unlisten(listener)
  }
}

const onKeypress = createListener('keydown')

export default class Escapable extends React.Component {
  static propTypes = {
    onEscape: PropTypes.func,
    children: PropTypes.node
  }

  static defaultProps = {
    onEscape: () => {},
    children: undefined
  }

  UNSAFE_componentWillMount() {
    this.removeListener = onKeypress(this.handleKeyPress)
  }

  componentWillUnmount() {
    this.removeListener()
  }

  handleKeyPress = event => {
    if (this.props.onEscape && event.key === 'Escape') {
      this.props.onEscape(event)
    }
  }

  render() {
    return this.props.children || null
  }
}
