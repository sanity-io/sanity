import React from 'react'
import FileInput from './FileInput'
import {omit} from 'lodash'

export default function createFileInput({upload, materializeReference}) {
  return class CustomFileInput extends React.PureComponent {
    static propTypes = omit(FileInput.propTypes, 'upload') //eslint-disable-line react/forbid-foreign-prop-types
    render() {
      return (
        <FileInput {...this.props} materializeReference={materializeReference} upload={upload} />
      )
    }
  }
}
