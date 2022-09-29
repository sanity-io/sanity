/* eslint-disable react/no-unused-prop-types */

import React from 'react'
import {Path} from '@sanity/types'

/** @internal */
export interface SimpleFocusManagerProps {
  path: any | null
  onFocus: () => void
  onBlur: () => void
  children: (arg: any) => any
}

/** @internal */
export interface SimpleFocusManagerState {
  focusPath: Array<any>
}

/** @internal */
export class SimpleFocusManager extends React.Component<
  SimpleFocusManagerProps,
  SimpleFocusManagerState
> {
  state = {
    focusPath: [],
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
      focusPath: this.state.focusPath,
    })
  }
}
