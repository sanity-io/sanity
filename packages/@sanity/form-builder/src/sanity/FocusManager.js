// @flow
import React from 'react'

type Props = {
  path: ?any,
  onFocus: () => {},
  onBlur: () => {},
  children: () => any
}

type State = {
  path: Array<*>
}

function unquote(str) {
  return str.replace(/^['"]/, '').replace(/['"]$/, '')
}
function splitAttr(segment) {
  const [attr, key] = segment.split('==')
  return {[attr]: unquote(key)}
}

function parseSimplePath(pathStr) {
  return pathStr
    .split(/[[.\]]/g)
    .filter(Boolean)
    .map(seg => (seg.includes('==') ? splitAttr(seg) : seg))
}

function getPathFromHash() {
  return parseSimplePath(document.location.hash.substring(1))
}

export default class FocusManager extends React.Component<Props, State> {
  state = {
    path: getPathFromHash().concat(true)
  }

  handleFocus = path => {
    this.setState({path})
  }

  handleBlur = () => {
    // this.setState({path: []})
  }

  render() {
    return (
      <div>
        {this.props.children({
          onBlur: this.handleBlur,
          onFocus: this.handleFocus,
          focusPath: this.state.path
        })}
      </div>
    )
  }
}
