import createDocumentStore from '@sanity/document-store'
import client from 'part:@sanity/base/client'
import {Observable} from 'rxjs'

const serverConnection = {
  byId(id) {
    return Observable.timer(0, 5000)
      .flatMap(() => client.getDocument(id))
      // .do(response => console.log('response', response))
      .map(doc => ({
        type: 'snapshot',
        document: doc
      }))
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
      .patch(id)
      .set(patch)
      .commit())
  },

  create(doc) {
    return Observable.from(client.create(doc))
  }
}

export default createDocumentStore({serverConnection})
