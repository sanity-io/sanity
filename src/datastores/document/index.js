import createDocumentStore from '@sanity/document-store'
import client from 'client:@sanity/base/client'
import {Observable} from 'rxjs'

const hasOwn = {}.hasOwnProperty
function flattenPatch(patch) {
  return Object.keys(patch).reduce((flattened, key) => {
    const val = patch[key]
    if (hasOwn.call(val, '$set')) {
      return Object.assign(flattened, {[key]: val.$set})
    }
    return flattened
  }, {})
}

const serverConnection = {
  byId(id) {
    return Observable.timer(0, 5000)
      .flatMap(() => client.fetch('*[.$id == %id]', {id}))
      // .do(response => console.log('response', response))
      .map(response => ({
        type: 'snapshot',
        document: response.result[0]
      }))
  },

  query(query, params) {
    return Observable.timer(0, 50000)
      .flatMap(() => client.fetch(query, params))
      .map(response => ({
        type: 'snapshot',
        documents: response.result
      }))
  },

  update(id, patch) {
    return Observable.from(client.update(id, flattenPatch(patch)))
  },

  create(document) {
    return Observable.from(client.create(document))
      .map(response => ({
        documentId: response.docIds[0]
      }))
  }
}

export default createDocumentStore({serverConnection})
