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
