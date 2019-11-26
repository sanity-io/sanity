import React from 'react'
import ImageInput, {Props} from '../../inputs/ImageInput'
import {materializeReference} from './client-adapters/assets'
import resolveUploader from '../uploads/resolveUploader'
import withDocument from '../../utils/withDocument'

export default withDocument(class SanityImageInput extends React.Component<Props> {
  _input: any
  focus() {
    if (this._input) {
      this._input.focus()
    }
  }
  setInput = input => {
    this._input = input
  }
  render() {
    return (
      <ImageInput
        {...this.props}
        resolveUploader={resolveUploader}
        materialize={materializeReference}
        ref={this.setInput}
      />
    )
  }
})
