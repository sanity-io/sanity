/**
 * An example of how to sync focus path through document.location.hash
 *
*/

// @flow
import React from 'react'
import {arrayToJSONMatchPath} from '../../../../mutator/lib/index'
import type {Path, PathSegment} from '../../typedefs/path'

type Props = {
  focusPath: ?any,
  onFocus: () => {},
  onBlur: () => {},
  children: () => any
}

type State = {
  focusPath: Array<*>
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

function parseSimplePath(focusPathStr): Path {
  return focusPathStr
    .split(/[[.\]]/g)
    .filter(Boolean)
    .map(seg => (seg.includes('==') ? splitAttr(seg) : coerce(seg)))
}

function formatPath(focusPath) {
  return arrayToJSONMatchPath(focusPath)
}

function getHash() {
  return decodeURIComponent(document.location.hash.substring(1))
}

function getPathFromHash() {
  const hash = getHash()
  return hash ? parseSimplePath(hash) : []
}

export default class HashFocusManager extends React.Component<Props, State> {
  state = {
    focusPath: getPathFromHash()
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.handleHashChange, false)
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.handleHashChange, false)
  }

  handleHashChange = () => {
    this.setState({focusPath: getPathFromHash()})
  }

  handleFocus = (focusPath: Path) => {
    document.location.hash = formatPath(focusPath)
  }

  handleBlur = () => {
    // this.setState({focusPath: []})
  }

  render() {
    return this.props.children({
      onBlur: this.handleBlur,
      onFocus: this.handleFocus,
      focusPath: this.state.focusPath
    })
  }
}
