import {FileInput} from '../../index'
import {uploadFile, materializeReference} from './client-adapters/assets'

export default FileInput.create({
  upload: uploadFile,
  materializeReference
})
