import React from 'react'
import request from '../util/request'

// Yeah, inheritance and all that. Deal with it.
class LoadingContainer extends React.PureComponent {
  constructor() {
    super()

    if (!this.getSubscriptions) {
      throw new Error(
        `${this.constructor.name} extended LoadingContainer but did not define a getSubscriptions() method`
      )
    }

    this.subscriptions = []
    this.state = {}
  }

  componentDidMount() {
    const subs = this.getSubscriptions()
    // eslint-disable-next-line no-multi-assign
    const stateKeys = (this.stateKeys = Object.keys(subs))

    this.subscriptions = stateKeys.reduce((target, key) => {
      target.push(request(this, subs[key], key))
      return target
    }, [])
  }

  hasAllData() {
    return this.stateKeys && this.stateKeys.every((key) => this.state[key] !== undefined)
  }

  componentWillUnmount() {
    while (this.subscriptions.length) {
      this.subscriptions.pop().unsubscribe()
    }
  }
}

export default LoadingContainer
