// A simple focus path manager
// @flow
import React from 'react'
import type {Path} from '../../typedefs/path'

type Props = {
  path: ?any,
  onFocus: () => {},
  onBlur: () => {},
  children: () => any
}

type State = {
  focusPath: Array<*>
}

export default class SimpleFocusManager extends React.Component<Props, State> {
  state = {
    focusPath: []
  }

  handleFocus = (path: Path) => {
    this.setState({focusPath: path})
  }

  handleBlur = () => {
    // do nothing
  }

  render() {
    return this.props.children({
      onBlur: this.handleBlur,
      onFocus: this.handleFocus,
      focusPath: this.state.focusPath
    })
  }
}
