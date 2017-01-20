import Observable from '@sanity/observable'
import createDocumentStore from '@sanity/document-store'
import client from 'part:@sanity/base/client'

function fetchDocumentSnapshot(id) {
  return client.getDocument(id)
    .then(document => {
      return {
        type: 'snapshot',
        document: document
      }
    })
}

function fetchQuerySnapshot(query, params) {
  return client.fetch(query, params)
    .then(documents => {
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
    return Observable.from(client.listen(query, params || {}, {events: ['welcome', 'mutation']}))
      .concatMap(event => {
        return (event.type === 'welcome')
          ? Observable.from(fetchQuerySnapshot(query, params))
          : Observable.of(event)
      })
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
