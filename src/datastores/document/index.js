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
    const mutations = calls.map(call => {
      const [id, patch] = call
      return {
        patch: Object.assign({id: id}, patch)
      }
    })
    return client.mutate(mutations, {returnDocuments: false})
      .then(res => res.documentIds)
  }, 1000, {accumulate: true})),

  delete(id) {
    return Observable.from(client.delete(id, {returnDocuments: false}))
  },

  create(doc) {
    return Observable.from(client.create(doc))
  }
}

export default createDocumentStore({serverConnection})
