import Observable from '@sanity/observable'
import createDocumentStore from '@sanity/document-store'
import client from 'part:@sanity/base/client'
import debounce from 'debounce-promise'
import observableTimer from '../utils/observableTimer'

function wrapInObservable(fn) {
  return (...args) => {
    return Observable.from(fn(...args))
  }
}

function getSnapshot(id) {
  return client.getDocument(id)
    .then(document => {
      return {
        type: 'snapshot',
        document: document
      }
    })
}

const serverConnection = {
  byId(id) {
    const mutations = client
      .listen('*[_id == $id]', {id: id})
      .filter(event => event.type === 'mutation')

    return new Observable(observer => {
      let mutationsSubscription
      // todo can be removed if/when gradient supports emitting current snapshot on subscribe
      getSnapshot(id).then(snapshot => {
        observer.next(snapshot)
        mutationsSubscription = mutations.subscribe(observer)
      }, err => observer.error(err))
      return () => {
        if (mutationsSubscription) {
          mutationsSubscription.unsubscribe()
        }
      }
    })
  },

  query(query, params) {
    return observableTimer(0, 10000)
      .flatMap(() => client.fetch(query, params))
      .map(documents => ({
        type: 'snapshot',
        documents: documents
      }))
      // .map(event => (console.log('document store event %O', event), event)) // debug
  },

  update: wrapInObservable(debounce(calls => {
    // Ugh, this is heartbreakingly ugly. Should be refactored soon.
    const patchesById = calls.reduce((collapsedPatch, call) => {
      const [id, patch] = call
      const operations = Object.keys(patch)
      operations.forEach(opName => {
        collapsedPatch[id] = collapsedPatch[id] || {}
        if (opName === 'unset') {
          collapsedPatch[id][opName] = (collapsedPatch[id][opName] || []).concat(patch[opName])
        } else {
          collapsedPatch[id][opName] = collapsedPatch[id][opName] || {}
          Object.assign(collapsedPatch[id][opName], patch[opName])
        }
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
