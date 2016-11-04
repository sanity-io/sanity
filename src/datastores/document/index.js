import createDocumentStore from '@sanity/document-store'
import client from 'part:@sanity/base/client'
import {omit} from 'lodash'
import {Observable} from 'rxjs'
const serverConnection = {
  byId(id) {
    return Observable
      .from(
        // todo can be removed when gradient supports emitting current snapshot on subscribe
        client.getDocument(id)
          .then(document => {
            return {
              type: 'snapshot',
              document: document
            }
          })
      )
      .merge(
        Observable.from(client.listen('*[_id == $id]', {id: id}))
          .filter(event => ('mutation' in event))
          // .filter(event => event.type === 'mutation') // todo replace above with this when fixed in gradient
          .map(event => {
            return {
              type: 'update',
              patch: omit(event.mutation.patch, 'id')
            }
          })
      )
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
      .commit({returnDocuments: false}))
  },

  create(doc) {
    return Observable.from(client.create(doc))
  }
}

export default createDocumentStore({serverConnection})
