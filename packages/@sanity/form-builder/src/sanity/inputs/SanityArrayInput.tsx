import React from 'react'
import formBuilderConfig from 'config:@sanity/form-builder'
import resolveUploader from '../uploads/resolveUploader'
import ArrayInput, {Props} from '../../inputs/arrays/ArrayOfObjectsInput'

const SUPPORT_DIRECT_UPLOADS = formBuilderConfig?.images?.directUploads

export default class SanityArray extends React.Component<Props> {
  input: any
  setInput = (input) => {
    this.input = input
  }
  focus() {
    this.input.focus()
  }
  render() {
    return (
      <ArrayInput
        ref={this.setInput}
        {...this.props}
        resolveUploader={resolveUploader}
        directUploads={SUPPORT_DIRECT_UPLOADS}
      />
    )
  }
}
