import React from 'react'
import PropTypes from 'prop-types'
import pubsub from 'nano-pubsub'

export function createStack() {
  let stack = []
  const changes = pubsub()

  function remove(instance) {
    stack = stack.filter(entry => entry !== instance)
    onChange()
  }

  function peek() {
    return stack[stack.length - 1]
  }
  function push(entry) {
    stack.push(entry)
    onChange()
  }

  function onChange() {
    changes.publish(peek())
  }

  return {
    remove,
    peek,
    push,
    subscribe: changes.subscribe
  }
}

const DEFAULT_STACK = createStack()

export default class Stacked extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
    stack: PropTypes.shape({
      remove: PropTypes.func,
      peek: PropTypes.func,
      push: PropTypes.func,
      subscribe: PropTypes.func
    })
  }

  static defaultProps = {
    stack: DEFAULT_STACK
  }

  state = {
    top: null
  }

  constructor(props) {
    super()
    this._unsubscribe = props.stack.subscribe(top => {
      this.setState(() => ({top}))
    })
  }
  UNSAFE_componentWillMount() {
    const {stack} = this.props
    stack.push(this)
  }

  componentWillUnmount() {
    const {stack} = this.props
    this._unsubscribe()
    stack.remove(this)
  }

  render() {
    return this.props.children(this.state.top === this)
  }
}
