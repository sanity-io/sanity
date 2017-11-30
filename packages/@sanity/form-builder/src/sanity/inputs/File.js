import * as FileInput from '../../inputs/File'
import {uploadFileAsset, materializeReference} from './client-adapters/assets'

export default FileInput.create({
  upload: uploadFileAsset,
  materializeReference
})
