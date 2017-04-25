import React from 'react'
import FileInput from './FileInput'

export default function createFileInput({upload, materializeReference}) {
  return class CustomFileInput extends React.PureComponent {
    render() {
      return (
        <FileInput {...this.props} materializeReference={materializeReference} upload={upload} />
      )
    }
  }
}
