import React from 'react'
import resolveUploader from '../uploads/resolveUploader'
import ArrayInput, {Props} from '../../inputs/arrays/ArrayOfObjectsInput'
export default class SanityArray extends React.Component<Props> {
  input: any
  setInput = (input) => {
    this.input = input
  }
  focus() {
    this.input.focus()
  }
  render() {
    return <ArrayInput ref={this.setInput} {...this.props} resolveUploader={resolveUploader} />
  }
}
