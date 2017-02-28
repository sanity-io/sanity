import {ImageInput} from '../../index'
import {uploadImage, materializeReference} from './client-adapters/assets'

export default ImageInput.create({
  upload: uploadImage,
  materializeReference
})
