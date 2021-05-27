import React from 'react'
import PropTypes from 'prop-types'
import request from '../util/request'

// Yeah, inheritance and all that. Deal with it.
// eslint-disable-next-line @typescript-eslint/ban-types
class LoadingContainer<Props, State extends {}> extends React.PureComponent<Props, State> {
  subscriptions: any[]
  stateKeys: string[] = []
  getSubscriptions: (() => {datasets: {uri: string}}) | null = null

  static contextTypes = {
    client: PropTypes.shape({fetch: PropTypes.func}).isRequired,
  }

  constructor(props: Props) {
    super(props)
    this.subscriptions = []
    this.state = {} as any
  }

  componentDidMount() {
    const subs = this.getSubscriptions ? this.getSubscriptions() : []

    this.stateKeys = Object.keys(subs)

    this.subscriptions = this.stateKeys.reduce((target: any[], key) => {
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
