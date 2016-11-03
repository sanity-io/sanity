import createDocumentStore from '@sanity/document-store'
import client from 'part:@sanity/base/client'
import {Observable} from 'rxjs'
const serverConnection = {
  byId(id) {
    return Observable
      .from(
        client.getDocument(id)
          .then(document => {
            return {
              type: 'snapshot',
              document: document
            }
          })
      )
      .merge(
        client.listen('*[_id == $id]', {id: id})
          .filter(event => ('mutation' in event))
          .map(event => {
            return {
              type: 'patch',
              patch: event.mutation.patch
            }
          })
      )
      .do(response => console.log('response', response))

  },

  query(query, params) {
    return Observable.timer(0, 50000)
      .flatMap(() => client.fetch(query, params))
      .map(documents => ({
        type: 'snapshot',
        documents: documents
      }))
  },

  update(id, patch) {
    return Observable.from(client
      .patch(id, patch)
      .commit())
  },

  create(doc) {
    return Observable.from(client.create(doc))
  }
}

export default createDocumentStore({serverConnection})
