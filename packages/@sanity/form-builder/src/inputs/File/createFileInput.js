import React from 'react'
import FileInput from './FileInput'
import {omit} from 'lodash'

export default function createFileInput({upload}) {
  return class CustomFileInput extends React.PureComponent {
    static propTypes = omit(FileInput.propTypes, 'upload') //eslint-disable-line react/forbid-foreign-prop-types
    static valueContainer = FileInput.valueContainer;

    render() {
      return (
        <FileInput {...this.props} upload={upload} />
      )
    }
  }
}
