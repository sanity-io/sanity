import client from 'part:@sanity/base/client'
import {FileInput} from '../../index'

function upload(image) {
  return client.assets.upload('file', image.file)
}

function materializeReference(id) {
  return console.log('get reference not yet supported')
}

export default FileInput.create({
  upload,
  materializeReference
})
