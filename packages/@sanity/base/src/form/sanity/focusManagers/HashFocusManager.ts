/* eslint-disable react/no-unused-prop-types */

import {Path} from '@sanity/types'
import React from 'react'
import {decodePath, encodePath} from '../../utils/path'

export type HashFocusManagerChildArgs = {
  onFocus: (path: Path) => void
  onBlur: () => void
  focusPath: Path
}

export interface HashFocusManagerProps {
  focusPath: any | null
  onFocus: () => void
  onBlur: () => void
  children: (arg0: HashFocusManagerChildArgs) => any
}

export interface HashFocusManagerState {
  focusPath: Array<any>
}

function getHash() {
  return decodeURIComponent(document.location.hash.substring(1))
}

function getPathFromHash() {
  const hash = getHash()
  return hash ? decodePath(hash) : []
}

/**
 * An example of how to sync focus path through document.location.hash
 */
export class HashFocusManager extends React.Component<
  HashFocusManagerProps,
  HashFocusManagerState
> {
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
