import * as React from 'react'
import * as PropTypes from 'prop-types'

export default class Delay extends React.Component {
  state = {done: false}

  componentDidMount() {
    this.timer = setTimeout(() => {
      this.setState({done: true})
    }, this.props.ms)
  }
  componentWillUnmount() {
    clearTimeout(this.timer)
  }

  render() {
    const {children} = this.props
    if (!this.state.done) {
      return null
    }
    return typeof children === 'function' ? children() : children
  }
}

Delay.propTypes = {
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  ms: PropTypes.number.isRequired
}
