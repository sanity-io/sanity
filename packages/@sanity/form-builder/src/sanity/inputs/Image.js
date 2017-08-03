import {ImageInput} from '../../index'
import {uploadImageAsset, materializeReference} from './client-adapters/assets'

export default ImageInput.create({
  upload: uploadImageAsset,
  materializeReference
})
