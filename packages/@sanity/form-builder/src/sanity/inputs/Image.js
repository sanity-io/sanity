import * as ImageInput from '../../inputs/Image'
import {uploadImageAsset, materializeReference} from './client-adapters/assets'

export default ImageInput.create({
  upload: uploadImageAsset,
  materializeReference
})
