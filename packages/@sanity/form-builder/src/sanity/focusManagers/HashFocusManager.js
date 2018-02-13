/**
 * An example of how to sync focus path through document.location.hash
 *
 */

// @flow
import React from 'react'
import type {Path} from '../../typedefs/path'
import {toFormBuilder, toGradient} from '../utils/convertPath'

type ChildArgs = {
  onFocus: (path: Path) => void,
  onBlur: () => void,
  focusPath: Path
}

type Props = {
  focusPath: ?any,
  onFocus: () => {},
  onBlur: () => {},
  children: (
    ChildArgs
  ) => any
}

type State = {
  focusPath: Array<*>
}

function getHash() {
  return decodeURIComponent(document.location.hash.substring(1))
}

function getPathFromHash() {
  const hash = getHash()
  return hash ? toFormBuilder(hash) : []
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
    document.location.hash = toGradient(focusPath)
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
