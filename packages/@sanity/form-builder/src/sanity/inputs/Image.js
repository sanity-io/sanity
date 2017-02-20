import client from 'part:@sanity/base/client'
import {ImageInput} from '../../index'

function upload(image) {
  return client.observable.assets.upload('image', image.file).map(event => {

    if (event.type === 'response') {
      // rewrite to a 'complete' event
      return {
        type: 'complete',
        id: event.body.document._id
      }
    }

    return event
  })
}

function materializeReference(id) {
  return client.fetch('*[_id == $id]', {id: id}).then(results => results[0])
}

export default ImageInput.create({
  upload,
  materializeReference
})
