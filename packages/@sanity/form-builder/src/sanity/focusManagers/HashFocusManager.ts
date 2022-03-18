/* eslint-disable react/no-unused-prop-types */

/**
 * An example of how to sync focus path through document.location.hash
 *
 */

import React from 'react'
import {Path} from '@sanity/types'
import {decodePath, encodePath} from '@sanity/base/_internal'

type ChildArgs = {
  onFocus: (path: Path) => void
  onBlur: () => void
  focusPath: Path
}

type Props = {
  focusPath: any | null
  onFocus: () => void
  onBlur: () => void
  children: (arg0: ChildArgs) => any
}

type State = {
  focusPath: Array<any>
}

function getHash() {
  return decodeURIComponent(document.location.hash.substring(1))
}

function getPathFromHash() {
  const hash = getHash()
  return hash ? decodePath(hash) : []
}

export class HashFocusManager extends React.Component<Props, State> {
  state = {
    focusPath: getPathFromHash(),
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
    document.location.hash = encodePath(focusPath)
  }

  handleBlur = () => {
    // this.setState({focusPath: []})
  }

  render() {
    return this.props.children({
      onBlur: this.handleBlur,
      onFocus: this.handleFocus,
      focusPath: this.state.focusPath,
    })
  }
}
