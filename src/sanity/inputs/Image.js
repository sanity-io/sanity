import client from 'part:@sanity/base/client'
import {ImageInput} from '../../index'

function upload(image) {
  return client.assets.upload('image', image.file).map(event => {

    if (event.type !== 'response') {
      return event
    }
    // rewrite event type
    return {
      type: 'complete',
      id: event.body.document._id
    }
  })
}

function materializeReference(id) {
  return client.fetch('*[_id == $id]', {id: id}).then(results => results[0])
}

export default ImageInput.create({
  upload,
  materializeReference
})
