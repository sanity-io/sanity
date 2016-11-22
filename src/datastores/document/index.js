import createDocumentStore from '@sanity/document-store'
import client from 'part:@sanity/base/client'
import {omit} from 'lodash'
import {Observable} from 'rxjs'
import debounce from 'debounce-promise'

function wrapInObservable(fn) {
  return (...args) => {
    return Observable.fromPromise(fn(...args))
  }
}

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

  update: wrapInObservable(debounce(calls => {
    // Ugh, this is heartbreakingly ugly. Should be refactored soon.
    const patchesById = calls.reduce((collapsedPatch, call) => {
      const [id, patch] = call
      const operations = Object.keys(patch)
      operations.forEach(opName => {
        collapsedPatch[id] = collapsedPatch[id] || {}
        collapsedPatch[id][opName] = collapsedPatch[id][opName] || {}
        Object.assign(collapsedPatch[id][opName], patch[opName])
      })
      return collapsedPatch
    }, {})
    const patches = Object.keys(patchesById).map(id => {
      const operations = patchesById[id]
      return Object.assign({id: id}, operations)
    })
    return Promise.all(patches.map(mut => {
      return client.mutate({patch: mut}, {returnDocuments: false})
    }))
  }, 500, {accumulate: true})),

  delete(id) {
    return Observable.from(client.delete(id, {returnDocuments: false}))
  },

  create(doc) {
    return Observable.from(client.create(doc))
  }
}

export default createDocumentStore({serverConnection})
