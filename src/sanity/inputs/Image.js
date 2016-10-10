import client from 'part:@sanity/base/client'
import {ImageInput} from '../../index'

function upload(image) {
  return client.assets.upload('image', image.file)
}

function materializeReference(id) {
  // eslnt-disable-next-line
  console.log('get reference not yet supported')
}

export default ImageInput.create({
  upload,
  materializeReference
})
