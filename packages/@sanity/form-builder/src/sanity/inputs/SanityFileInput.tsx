import React from 'react'
import FileInput, {Props} from '../../inputs/files/FileInput'
import resolveUploader from '../uploads/resolveUploader'
import {materializeReference} from './client-adapters/assets'
export default class SanityFileInput extends React.Component<Props> {
  _input: any
  focus() {
    if (this._input) {
      this._input.focus()
    }
  }
  setInput = (input) => {
    this._input = input
  }
  render() {
    return (
      <FileInput
        {...this.props}
        resolveUploader={resolveUploader}
        materialize={materializeReference}
        ref={this.setInput}
      />
    )
  }
}
