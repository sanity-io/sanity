import Observable from '@sanity/observable'
import createDocumentStore from '@sanity/document-store'
import client from 'part:@sanity/base/client'
import observableTimer from '../utils/observableTimer'

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
      // todo need to sync events with snapshot
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
    // todo
    return observableTimer(0, 10000)
      .flatMap(() => client.fetch(query, params))
      .map(documents => ({
        type: 'snapshot',
        documents: documents
      }))
      // .map(event => (console.log('document store event %O', event), event)) // debug
  },

  mutate(mutations) {
    return Observable.from(client.dataRequest('mutate', mutations, {returnDocuments: false}))
  },

  delete(id) {
    return Observable.from(client.delete(id, {returnDocuments: false}))
  },

  create(doc) {
    return Observable.from(client.create(doc))
  }
}

export default createDocumentStore({serverConnection})
