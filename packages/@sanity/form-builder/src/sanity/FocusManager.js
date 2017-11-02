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

function getHash() {
  return document.location.hash.substring(1)
}
function getPathFromHash() {
  const hash = getHash()
  return hash ? parseSimplePath().concat(true) : []
}

export default class FocusManager extends React.Component<Props, State> {
  state = {
    path: getPathFromHash()
  }

  handleFocus = path => {
    this.setState({path})
  }

  handleBlur = () => {
    // todo: handle presence
    // this.setState({path: []})
  }

  render() {
    return (
      <div>
        <div style={{position: 'fixed', padding: '1em', zIndex: 10000, backgroundColor: 'white'}}>
          Focus: {JSON.stringify(this.state.path)}
        </div>
        <div>
          {this.props.children({
            onBlur: this.handleBlur,
            onFocus: this.handleFocus,
            focusPath: this.state.path
          })}
        </div>
      </div>
    )
  }
}
