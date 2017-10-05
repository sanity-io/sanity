import {FileInput} from '../../index'
import {uploadFileAsset, materializeReference} from './client-adapters/assets'

export default FileInput.create({
  upload: uploadFileAsset,
  materializeReference
})
