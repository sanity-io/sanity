/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/require-default-props */
/* eslint-disable react/require-optimization */

import * as React from 'react'
import * as PropTypes from 'prop-types'

export default class UseState extends React.Component {
  constructor(props) {
    super(props)
    this.state = {value: props.startWith}
  }

  setValue = nextValue => this.setState({value: nextValue})

  render() {
    return this.props.children([this.state.value, this.setValue])
  }
}

UseState.propTypes = {
  startWith: PropTypes.any,
  children: PropTypes.func
}
