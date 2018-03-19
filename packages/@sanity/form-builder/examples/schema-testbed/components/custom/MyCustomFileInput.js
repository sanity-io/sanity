import {FileInput} from '../../../../src'
import {mockUploadFile, mockMaterializeReference} from './mock/uploader'

export default FileInput.create({
  upload: mockUploadFile,
  materializeReference: mockMaterializeReference
})
