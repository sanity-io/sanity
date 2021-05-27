import React from 'react'
import LoadingSpinner from './LoadingSpinner'

export interface DelayedSpinnerProps {
  delay?: number
}

export interface DelayedSpinnerState {
  show?: boolean
}

// Waits for X ms before showing a spinner
class DelayedSpinner extends React.PureComponent<DelayedSpinnerProps, DelayedSpinnerState> {
  timer: NodeJS.Timer | null = null

  constructor(props: DelayedSpinnerProps) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    const {delay = 500} = this.props

    this.timer = setTimeout(() => this.setState({show: true}), delay)
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer)
  }

  render() {
    return this.state.show ? <LoadingSpinner /> : null
  }
}

export default DelayedSpinner
