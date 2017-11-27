import React from 'react'

export default class Subscribe extends React.Component {

  constructor(props) {
    super()
    this.state = {
      value: props.initial
    }
  }

  componentDidMount() {
    this.unsubscribe = this.props.updates.subscribe(this.update)
  }

  update = value => {
    this.setState({value})
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  render() {
    return this.props.children(this.state.value)
  }
}
