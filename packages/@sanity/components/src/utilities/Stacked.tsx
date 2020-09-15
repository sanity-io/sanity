import pubsub from 'nano-pubsub'
import React from 'react'

interface StackedProps {
  children: (top: boolean) => React.ReactNode
  stack?: {
    remove?: (val: unknown) => void
    peek?: () => void
    push?: (val: unknown) => void
    subscribe?: (val: unknown) => void
  }
}

export function createStack<T = unknown>() {
  let stack: T[] = []
  const changes = pubsub()

  function remove(instance: T) {
    stack = stack.filter(entry => entry !== instance)
    onChange()
  }

  function peek() {
    return stack[stack.length - 1]
  }

  function push(entry: T) {
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

export default class Stacked extends React.Component<StackedProps> {
  static defaultProps = {
    stack: DEFAULT_STACK
  }

  state = {
    top: null
  }

  _unsubscribe: any

  constructor(props: StackedProps) {
    super(props)

    const {stack} = props

    if (stack && stack.subscribe) {
      this._unsubscribe = stack.subscribe((top: unknown) => {
        this.setState(_ => ({top}))
      })
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    const {stack} = this.props
    if (stack && stack.push) stack.push(this)
  }

  componentWillUnmount() {
    const {stack} = this.props

    this._unsubscribe()

    if (stack && stack.remove) {
      stack.remove(this)
    }
  }

  render() {
    return this.props.children(this.state.top === this)
  }
}
