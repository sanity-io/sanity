// @flow
import React from 'react'
import {arrayToJSONMatchPath} from '@sanity/mutator'
import type {Path, PathSegment} from '../typedefs/path'

type Props = {
  path: ?any,
  onFocus: () => {},
  onBlur: () => {},
  children: () => any
}

type State = {
  path: Array<*>
}
const IS_NUMERIC = /^\d+$/

function unquote(str) {
  return str.replace(/^['"]/, '').replace(/['"]$/, '')
}

function splitAttr(segment) {
  const [attr, key] = segment.split('==')
  return {[attr]: unquote(key)}
}

function coerce(segment: string): PathSegment {
  return IS_NUMERIC.test(segment) ? Number(segment) : segment
}

function parseSimplePath(pathStr): Path {
  return pathStr
    .split(/[[.\]]/g)
    .filter(Boolean)
    .map(seg => (seg.includes('==') ? splitAttr(seg) : coerce(seg)))
}

function formatPath(path) {
  return arrayToJSONMatchPath(path)
}

function getHash() {
  return decodeURIComponent(document.location.hash.substring(1))
}

function getPathFromHash() {
  const hash = getHash()
  return hash ? parseSimplePath(hash) : []
}

export default class FocusManager extends React.Component<Props, State> {
  state = {
    // path: ['someArray', {_key: '1de84e76205d'}]
    path: getPathFromHash()
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.handleHashChange, false)
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.handleHashChange, false)
  }

  handleHashChange = () => {
    this.setState({path: getPathFromHash()})
  }

  handleFocus = (path: Path) => {
    console.log('focus at', path)
    // this.setState({path})
    document.location.hash = formatPath(path)
  }

  handleBlur = () => {
    // todo: handle presence
    // this.setState({path: []})
  }

  render() {
    return (
      <div>
        {false && (<div style={{position: 'fixed', padding: '1em', zIndex: 10000, backgroundColor: 'white'}}>
          Focus: {JSON.stringify(this.state.path)}
        </div>)}
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
