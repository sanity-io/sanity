import React from 'react'

import {search, getPreviewSnapshot} from './client-adapters/reference'
import ReferenceInput, {Props} from '../../inputs/ReferenceInput'

export default class SanityReference extends React.Component<Props> {
  _input: any
  setInput = (input) => {
    this._input = input
  }
  focus() {
    this._input.focus()
  }
  render() {
    return (
      <ReferenceInput
        {...this.props}
        onSearch={search}
        getPreviewSnapshot={getPreviewSnapshot}
        ref={this.setInput}
      />
    )
  }
}
