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

export function createStack() {
  let stack = []

  function remove(instance) {
    stack = stack.filter(entry => entry !== instance)
  }

  function peek() {
    return stack[stack.length - 1]
  }
  function push(entry) {
    return stack.push(entry)
  }

  return {
    remove,
    peek,
    push
  }
}

const DEFAULT_STACK = createStack()

export default class StackedEscapable extends React.Component {
  static propTypes = {
    onEscape: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    stack: PropTypes.shape({
      remove: PropTypes.func,
      peek: PropTypes.func,
      push: PropTypes.func
    })
  }

  static defaultProps = {
    stack: DEFAULT_STACK
  }

  componentWillMount() {
    const {stack} = this.props
    stack.push(this)
    this.removeListener = onKeypress(this.handleKeyPress)
  }

  componentWillUnmount() {
    const {stack} = this.props
    stack.remove(this)
    this.removeListener()
  }

  handleKeyPress = event => {
    const {stack} = this.props
    if (event.key === 'Escape' && (stack.peek() === this || event.shiftKey)) {
      this.props.onEscape()
    }
  }

  render() {
    return this.props.children
  }
}

export function withEscapeStack(Component, stack = DEFAULT_STACK) {
  function WithEscapeStack({onEscape, ...props}) { // eslint-disable-line react/no-multi-comp
    return (
      <StackedEscapable onEscape={onEscape} stack={stack}>
        <Component {...props} />
      </StackedEscapable>
    )
  }
  WithEscapeStack.displayName = `withEscapeStack(${Component.displayName || Component.name})`
  WithEscapeStack.propTypes = {
    onEscape: PropTypes.func.isRequired
  }
  return WithEscapeStack
}
