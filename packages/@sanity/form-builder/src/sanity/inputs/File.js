import client from 'part:@sanity/base/client'
import {FileInput} from '../../index'

function upload(file) {
  return client.observable.assets.upload('file', file).map(event => {

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

export default FileInput.create({
  upload,
  materializeReference
})
