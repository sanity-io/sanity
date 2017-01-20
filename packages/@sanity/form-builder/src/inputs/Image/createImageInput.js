import React from 'react'
import ImageInput from './ImageInput'
import {omit} from 'lodash'

export default function createImageInput({upload, materializeReference}) {
  return class CustomImageInput extends React.PureComponent {
    static propTypes = omit(ImageInput.propTypes, 'uploadFn', 'materializeReferenceFn');
    static valueContainer = ImageInput.valueContainer;

    render() {
      return (
        <ImageInput {...this.props} uploadFn={upload} materializeReferenceFn={materializeReference} />
      )
    }
  }
}
