import {ImageInput} from '../../../../src'
import {mockUploadImage, mockMaterializeReference} from './mock/uploader'

export default ImageInput.create({
  upload: mockUploadImage,
  materializeReference: mockMaterializeReference
})
