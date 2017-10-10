import React from 'react'
import ImageInput from './ImageInput'

export default function createImageInput({upload, materializeReference}) {
  return class CustomImageInput extends React.Component {
    render() {
      return (
        <ImageInput {...this.props} uploadFn={upload} materializeReferenceFn={materializeReference} />
      )
    }
  }
}
