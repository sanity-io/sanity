import React from 'react'

interface Props<T = any> {
  children: (arg: [v: T, set: (v: T) => void]) => React.ReactNode
  startWith: T
}

interface State {
  value: any
}

export default class UseState extends React.Component<Props, State> {
  constructor(props) {
    super(props)
    this.state = {value: props.startWith}
  }

  setValue = (nextValue) => this.setState({value: nextValue})

  render() {
    return this.props.children([this.state.value, this.setValue])
  }
}
