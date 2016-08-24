import createDocumentStore from '@sanity/document-store'
import client from 'client:@sanity/base/client'
import observableTimer from '../utils/observableTimer'
import Observable from '../utils/SanityStoreObservable'
import promiseToObservable from '../utils/promiseToObservable'

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
    return observableTimer(0, 5000)
      .map(() => client.fetch('*[.$id == %id]', {id}))
      .flatMap(promiseToObservable)
      // .do(response => console.log('response', response))
      .map(response => ({
        type: 'snapshot',
        document: response.result[0]
      }))
  },

  query(query, params) {
    return observableTimer(0, 50000)
      .map(() => client.fetch(query, params))
      .flatMap(promiseToObservable)
      .map(response => ({
        type: 'snapshot',
        documents: response.result
      }))
  },

  update(id, patch) {
    return promiseToObservable(client.update(id, flattenPatch(patch)))
  },

  create(document) {
    return promiseToObservable(client.create(document))
      .map(response => ({
        documentId: response.docIds[0]
      }))
  }
}

export default createDocumentStore({serverConnection})
