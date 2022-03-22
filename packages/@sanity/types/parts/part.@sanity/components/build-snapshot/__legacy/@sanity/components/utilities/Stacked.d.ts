import type React from 'react'
interface StackedProps {
  children: (top: boolean) => React.ReactNode
  stack?: {
    remove?: (val: unknown) => void
    peek?: () => void
    push?: (val: unknown) => void
    subscribe?: (val: unknown) => () => void
  }
}
export declare function createStack<T = unknown>(): {
  remove: (instance: T) => void
  peek: () => T
  push: (entry: T) => void
  subscribe: (subscriber: import('nano-pubsub').Subscriber<T>) => () => void
}
export default class Stacked extends React.Component<StackedProps> {
  static defaultProps: {
    stack: {
      remove: (instance: unknown) => void
      peek: () => unknown
      push: (entry: unknown) => void
      subscribe: (subscriber: import('nano-pubsub').Subscriber<unknown>) => () => void
    }
  }
  state: {
    top: any
  }
  _unsubscribe?: () => void
  constructor(props: StackedProps)
  UNSAFE_componentWillMount(): void
  componentWillUnmount(): void
  render(): React.ReactNode
}
export {}
