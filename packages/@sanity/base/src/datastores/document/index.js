import Observable from '@sanity/observable'
import createDocumentStore from '@sanity/document-store'
import client from 'part:@sanity/base/client'

function fetchDocumentSnapshot(id) {
  return client.observable.getDocument(id)
    .map(document => {
      return {
        type: 'snapshot',
        document: document
      }
    })
}

function fetchQuerySnapshot(query, params) {
  return client.observable.fetch(query, params)
    .map(documents => {
      return {
        type: 'snapshot',
        documents: documents
      }
    })
}

const serverConnection = {
  byId(id) {
    return Observable.from(client.listen('*[_id == $id]', {id: id}, {events: ['welcome', 'mutation']}))
      .concatMap(event => {
        return (event.type === 'welcome')
          ? Observable.from(fetchDocumentSnapshot(id))
          : Observable.of(event)
      })
  },

  query(query, params) {
    return Observable.from(client.observable.listen(query, params || {}, {events: ['welcome', 'mutation']}))
      .concatMap(event => {
        return (event.type === 'welcome')
          ? Observable.from(fetchQuerySnapshot(query, params))
          : Observable.of(event)
      })
  },

  mutate(mutations) {
    return Observable.from(client.observable.dataRequest('mutate', mutations, {visibility: 'async', returnDocuments: false}))
  },

  delete(id) {
    return Observable.from(client.observable.delete(id, {visibility: 'async', returnDocuments: false}))
  },

  create(doc) {
    return Observable.from(client.observable.create(doc))
  },
  createIfNotExists(doc) {
    return Observable.from(client.observable.createIfNotExists(doc))
  },
  createOrReplace(doc) {
    return Observable.from(client.observable.createOrReplace(doc))
  }
}

export default createDocumentStore({serverConnection})
